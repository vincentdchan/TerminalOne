use tauri::{AboutMetadata, CustomMenuItem, Menu, MenuItem, Submenu};

/// Creates a menu filled with default menu items and submenus.
///
/// ## Platform-specific:
///
/// - **Windows**:
///   - File
///     - CloseWindow
///     - Quit
///   - Edit
///     - Cut
///     - Copy
///     - Paste
///   - Window
///     - Minimize
///     - CloseWindow
///
/// - **Linux**:
///   - File
///     - CloseWindow
///     - Quit
///   - Window
///     - Minimize
///     - CloseWindow
///
/// - **macOS**:
///   - App
///     - About
///     - Separator
///     - Services
///     - Separator
///     - Hide
///     - HideOthers
///     - ShowAll
///     - Separator
///     - Quit
///   - File
///     - CloseWindow
///   - Edit
///     - Undo
///     - Redo
///     - Separator
///     - Cut
///     - Copy
///     - Paste
///     - SelectAll
///   - View
///     - EnterFullScreen
///   - Window
///     - Minimize
///     - Zoom
///     - Separator
///     - CloseWindow
pub fn generate_menu(#[allow(unused)] app_name: &str) -> Menu {
    let mut menu = Menu::new();
    #[cfg(target_os = "macos")]
    {
        let mut settings_menu_item = CustomMenuItem::new("settings", "Settings");
        settings_menu_item.keyboard_accelerator = Some("CmdOrCtrl+,".to_string());
        menu = menu.add_submenu(Submenu::new(
            app_name,
            Menu::new()
                .add_native_item(MenuItem::About(
                    app_name.to_string(),
                    AboutMetadata::default(),
                ))
                .add_native_item(MenuItem::Separator)
                .add_item(settings_menu_item)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Services)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Hide)
                .add_native_item(MenuItem::HideOthers)
                .add_native_item(MenuItem::ShowAll)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::Quit),
        ));
    }

    let shell_menu = {
        let mut new_tab_menu_item = CustomMenuItem::new("new-tab", "New Tab");
        new_tab_menu_item.keyboard_accelerator = Some("CmdOrCtrl+T".to_string());

        let mut close_tab_menu_item = CustomMenuItem::new("close-tab", "Close Tab");
        close_tab_menu_item.keyboard_accelerator = Some("CmdOrCtrl+W".to_string());

        let menu = Menu::new()
            .add_item(new_tab_menu_item)
            .add_native_item(MenuItem::Separator)
            .add_item(close_tab_menu_item);
        menu
    };
    #[cfg(not(target_os = "macos"))]
    {
        shell_menu = file_menu.add_native_item(MenuItem::Quit);
    }
    menu = menu.add_submenu(Submenu::new("Shell", shell_menu));

    #[cfg(not(target_os = "linux"))]
    let mut edit_menu = Menu::new();
    #[cfg(target_os = "macos")]
    {
        edit_menu = edit_menu.add_native_item(MenuItem::Undo);
        edit_menu = edit_menu.add_native_item(MenuItem::Redo);
        edit_menu = edit_menu.add_native_item(MenuItem::Separator);
    }
    #[cfg(not(target_os = "linux"))]
    {
        edit_menu = edit_menu.add_native_item(MenuItem::Cut);
        edit_menu = edit_menu.add_native_item(MenuItem::Copy);
        edit_menu = edit_menu.add_native_item(MenuItem::Paste);
    }
    #[cfg(target_os = "macos")]
    {
        edit_menu = edit_menu.add_native_item(MenuItem::SelectAll);
    }
    #[cfg(not(target_os = "linux"))]
    {
        menu = menu.add_submenu(Submenu::new("Edit", edit_menu));
    }
    #[cfg(target_os = "macos")]
    {
        let mut explorer_menu_item = CustomMenuItem::new("explorer", "Explorer");
        explorer_menu_item.keyboard_accelerator = Some("CmdOrCtrl+Shift+E".to_string());
        menu = menu.add_submenu(Submenu::new(
            "View",
            Menu::new()
                .add_item(explorer_menu_item)
                .add_native_item(MenuItem::Separator)
                .add_native_item(MenuItem::EnterFullScreen),
        ));
    }

    let mut window_menu = Menu::new();
    window_menu = window_menu.add_native_item(MenuItem::Minimize);
    #[cfg(target_os = "macos")]
    {
        window_menu = window_menu.add_native_item(MenuItem::Zoom);
        window_menu = window_menu.add_native_item(MenuItem::Separator);
    }
    window_menu = window_menu.add_native_item(MenuItem::CloseWindow);
    menu = menu.add_submenu(Submenu::new("Window", window_menu));

    menu
}