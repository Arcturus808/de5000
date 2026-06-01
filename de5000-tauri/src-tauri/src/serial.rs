use serde::Serialize;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

const BAUD_RATE: u32 = 9600;
const PACKET_LENGTH: usize = 17;
const HEADER: [u8; 2] = [0x00, 0x0D];
const FOOTER: [u8; 2] = [0x0D, 0x0A];

pub struct SerialState {
    reading: Arc<AtomicBool>,
}

impl SerialState {
    pub fn new() -> Self {
        Self {
            reading: Arc::new(AtomicBool::new(false)),
        }
    }
}

#[derive(Serialize)]
pub struct PortInfo {
    name: String,
    port_type: String,
}

#[tauri::command]
pub fn list_ports() -> Result<Vec<PortInfo>, String> {
    let ports =
        serialport::available_ports().map_err(|e| format!("Failed to list ports: {}", e))?;

    Ok(ports
        .iter()
        .map(|p| {
            let port_type = match &p.port_type {
                serialport::SerialPortType::UsbPort(info) => {
                    let product = info.product.as_deref().unwrap_or("Unknown");
                    let manufacturer = info.manufacturer.as_deref().unwrap_or("");
                    if manufacturer.is_empty() {
                        format!("USB ({})", product)
                    } else {
                        format!("USB ({} - {})", manufacturer, product)
                    }
                }
                serialport::SerialPortType::BluetoothPort => "Bluetooth".to_string(),
                serialport::SerialPortType::PciPort => "PCI".to_string(),
                serialport::SerialPortType::Unknown => "Unknown".to_string(),
            };
            PortInfo {
                name: p.port_name.clone(),
                port_type,
            }
        })
        .collect())
}

#[tauri::command]
pub fn connect(
    app: AppHandle,
    state: tauri::State<'_, SerialState>,
    port_name: String,
) -> Result<(), String> {
    if state.reading.load(Ordering::SeqCst) {
        return Err("Already connected. Disconnect first.".to_string());
    }

    let mut port = serialport::new(&port_name, BAUD_RATE)
        .data_bits(serialport::DataBits::Eight)
        .parity(serialport::Parity::None)
        .stop_bits(serialport::StopBits::One)
        .timeout(Duration::from_millis(1000))
        .open()
        .map_err(|e| format!("Failed to open port {}: {}", port_name, e))?;

    port.write_data_terminal_ready(true)
        .map_err(|e| format!("Failed to set DTR: {}", e))?;
    port.write_request_to_send(false)
        .map_err(|e| format!("Failed to set RTS: {}", e))?;

    state.reading.store(true, Ordering::SeqCst);
    let reading = state.reading.clone();

    std::thread::spawn(move || {
        read_loop(app, port.as_mut(), reading);
    });

    Ok(())
}

#[tauri::command]
pub fn disconnect(state: tauri::State<'_, SerialState>) -> Result<(), String> {
    state.reading.store(false, Ordering::SeqCst);
    Ok(())
}

fn read_loop(app: AppHandle, port: &mut dyn serialport::SerialPort, reading: Arc<AtomicBool>) {
    let mut buffer: Vec<u8> = Vec::new();
    let mut read_buf = [0u8; 256];

    while reading.load(Ordering::SeqCst) {
        match port.read(&mut read_buf) {
            Ok(n) if n > 0 => {
                buffer.extend_from_slice(&read_buf[..n]);

                while buffer.len() >= PACKET_LENGTH {
                    if let Some(header_idx) = find_header(&buffer) {
                        if buffer.len() >= header_idx + PACKET_LENGTH {
                            let packet: Vec<u8> =
                                buffer[header_idx..header_idx + PACKET_LENGTH].to_vec();

                            if validate_packet(&packet) {
                                let _ = app.emit("serial-packet", &packet);
                            }

                            buffer.drain(..header_idx + PACKET_LENGTH);
                        } else {
                            break;
                        }
                    } else {
                        buffer.remove(0);
                    }
                }
            }
            Ok(_) => {}
            Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {
                // Timeout is expected, just loop
            }
            Err(e) => {
                let msg = match e.kind() {
                    std::io::ErrorKind::PermissionDenied => "Device disconnected".to_string(),
                    std::io::ErrorKind::BrokenPipe => "Device disconnected".to_string(),
                    std::io::ErrorKind::NotConnected => "Device disconnected".to_string(),
                    _ => format!("Connection lost: {}", e),
                };
                let _ = app.emit("serial-error", msg);
                break;
            }
        }
    }

    reading.store(false, Ordering::SeqCst);
    let _ = app.emit("serial-disconnected", ());
}

fn find_header(buffer: &[u8]) -> Option<usize> {
    for i in 0..buffer.len().saturating_sub(1) {
        if buffer[i] == HEADER[0] && buffer[i + 1] == HEADER[1] {
            return Some(i);
        }
    }
    None
}

fn validate_packet(data: &[u8]) -> bool {
    if data.len() != PACKET_LENGTH {
        return false;
    }
    if data[0] != HEADER[0] || data[1] != HEADER[1] {
        return false;
    }
    if data[15] != FOOTER[0] || data[16] != FOOTER[1] {
        return false;
    }
    true
}
