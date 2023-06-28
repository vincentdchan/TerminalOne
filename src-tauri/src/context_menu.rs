use std::sync::Mutex;

use crate::messages::{push_event, OpenContextMenuClickedMessage, OpenContextMenuReq};
use cocoa::appkit::CGPoint;
use cocoa::appkit::{NSMenu, NSMenuItem, NSWindow};
use cocoa::base::nil;
use cocoa::foundation::NSPoint;
use cocoa::foundation::NSString;
use lazy_static::lazy_static;
use log::debug;
use objc::declare::ClassDecl;
use objc::runtime::{Object, Sel};

struct ObjectWrapper(*mut Object);

// imple send for ObjectWrapper
unsafe impl Send for ObjectWrapper {}
unsafe impl Sync for ObjectWrapper {}

lazy_static! {
    static ref MY_DELEGATE_DECL: ObjectWrapper = {
        unsafe {
            // Create NSWindowDelegate
            let superclass = class!(NSObject);
            let mut decl = ClassDecl::new("MyWindowDelegate", superclass).unwrap();

            decl.add_method(sel!(onContextMenuItemClicked:), context_menu_item_clicked as extern fn(&mut Object, Sel, cocoa::base::id) -> ());
            decl.add_method(sel!(menuDidClose:), context_menu_did_closed as extern fn(&Object, Sel, cocoa::base::id) -> ());
            decl.add_ivar::<*mut Object>("contextMenuId");

            let delegate_class = decl.register();
            ObjectWrapper(delegate_class as *const _ as *mut _)
        }
    };

    static ref GLOBAL_WINDOW: Mutex<Option<tauri::Window>> = Mutex::new(None);

}

extern "C" fn context_menu_item_clicked(this: &mut Object, _: Sel, sender: cocoa::base::id) {
    unsafe {
        let ns_id = this.get_ivar::<*mut Object>("contextMenuId");
        let menu_id = ns_id.UTF8String();
        let rust_menu_id = std::ffi::CStr::from_ptr(menu_id).to_str().unwrap();
        let tag: *mut Object = msg_send![sender, tag];
        let tag_str = tag.UTF8String();
        let rust_str = std::ffi::CStr::from_ptr(tag_str).to_str().unwrap();
        debug!("context_menu_item_clicked: {}, id: {}", rust_str, rust_menu_id);
        let global_window_guard = GLOBAL_WINDOW.lock().unwrap();
        if let Some(global_window) = &*global_window_guard {
            let _ = global_window.emit(
                push_event::CONTEXT_MENU_CLICKED,
                OpenContextMenuClickedMessage {
                    id: rust_menu_id.to_string(),
                    key: rust_str.to_string(),
                },
            );
        }
    }
}

extern "C" fn context_menu_did_closed(_: &Object, _: Sel, _: cocoa::base::id) {
    debug!("context_menu_did_closed");
}

#[cfg(target_os = "macos")]
pub fn open(tauri_window: tauri::Window, req: OpenContextMenuReq) {
    {
        let mut global_window_guard = GLOBAL_WINDOW.lock().unwrap();
        if global_window_guard.is_none() {
            *global_window_guard = Some(tauri_window.clone());
        }
    }
    debug!("open context menu: {:}", req.id);

    unsafe {
        let window = tauri_window.ns_window().unwrap() as cocoa::base::id;
        let window_content_view = window.contentView();
        let window_content_view_frame = window_content_view.frame();

        let delegate_decl = MY_DELEGATE_DECL.0 as cocoa::base::id;
        let delegate_object: *mut Object = msg_send![delegate_decl, new];

        let deletage_obj: &mut Object = &mut *delegate_object;
        let ns_id = NSString::alloc(nil).init_str(&req.id);
        deletage_obj.set_ivar::<*mut Object>("contextMenuId", ns_id);

        let menu = NSMenu::new(nil);
        let _: () = msg_send![menu, setDelegate: delegate_object];

        for item in req.items {
            let title = NSString::alloc(nil).init_str(&item.title);
            let action = sel!(onContextMenuItemClicked:);
            let menu_item = NSMenuItem::alloc(nil).initWithTitle_action_keyEquivalent_(
                title,
                action,
                NSString::alloc(cocoa::base::nil).init_str(""),
            );
            menu_item.setTarget_(delegate_object);
            let _: () = msg_send![menu_item, setTag:NSString::alloc(nil).init_str(&item.key)];
            menu.addItem_(menu_item);
        }

        let x = req.position[0];
        let y = req.position[1];
        // popup the menu
        let cg_point = CGPoint::new(x, window_content_view_frame.size.height - y);
        debug!("open_context_menu: x={}, y={}", cg_point.x, cg_point.y);

        let convert_point: CGPoint =
            msg_send![window_content_view, convertPoint:cg_point fromView:nil];
        let _: () = msg_send![menu, popUpMenuPositioningItem: nil atLocation: NSPoint::new(convert_point.x, convert_point.y) inView: window_content_view];
    }
}
