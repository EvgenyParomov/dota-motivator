use sysinfo::{ProcessRefreshKind, RefreshKind, Signal, System};

const DOTA_PROCESS: &str = "dota2.exe";
const DOTA_PROCESS_LINUX: &str = "dota2";

fn target_name() -> &'static str {
    if cfg!(target_os = "windows") {
        DOTA_PROCESS
    } else {
        DOTA_PROCESS_LINUX
    }
}

#[tauri::command]
pub fn is_dota_running() -> bool {
    let mut sys = System::new_with_specifics(
        RefreshKind::new().with_processes(ProcessRefreshKind::new()),
    );
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
    sys.processes()
        .values()
        .any(|p| p.name().to_string_lossy().eq_ignore_ascii_case(target_name()))
}

#[tauri::command]
pub fn kill_dota() -> usize {
    let mut sys = System::new_with_specifics(
        RefreshKind::new().with_processes(ProcessRefreshKind::new()),
    );
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
    let mut killed = 0usize;
    for p in sys.processes().values() {
        if p.name().to_string_lossy().eq_ignore_ascii_case(target_name()) {
            if p.kill_with(Signal::Kill).unwrap_or(false) {
                killed += 1;
            } else if p.kill() {
                killed += 1;
            }
        }
    }
    killed
}
