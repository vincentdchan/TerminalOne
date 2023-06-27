use std::ffi::{c_char, c_long, c_void};

use log::{debug, info};
use objc::declare::ClassDecl;
use crate::messages::OpenContextMenuReq;
use cocoa::appkit::{NSWindow, NSWindowStyleMask};
use cocoa::base::{NO, YES};
use cocoa::base::nil;
use core_foundation::array::CFArrayGetTypeID;
use core_foundation::array::*;
use core_foundation::base::{CFGetTypeID, CFRelease};
use core_foundation::dictionary::*;
use core_foundation::number::{kCFNumberLongType, CFNumberGetTypeID, CFNumberGetValue};
use core_foundation::string::*;
use objc::runtime::{Object, Sel};
use serde_json::Value;
use tauri::{Runtime, Window};
use lazy_static::lazy_static;

#[allow(dead_code)]
pub type CFTypeID = ::core::ffi::c_ulong;
#[allow(dead_code)]
pub type CFDictionaryRef = *const __CFDictionary;
#[allow(dead_code)]
pub type CFStringRef = *const __CFString;
#[allow(dead_code)]
pub type CFArrayRef = *const __CFArray;

#[link(name = "CFNetwork", kind = "framework")]
extern "C" {
    pub fn CFNetworkCopySystemProxySettings() -> CFDictionaryRef;

}

struct ObjectWrapper(*mut Object);

// imple send for ObjectWrapper
unsafe impl Send for ObjectWrapper {}
unsafe impl Sync for ObjectWrapper {}

lazy_static! {
    static ref MY_DELEGATE: ObjectWrapper = {
        unsafe {
            // Create NSWindowDelegate
            let superclass = class!(NSObject);
            let mut decl = ClassDecl::new("MyWindowDelegate", superclass).unwrap();

            decl.add_method(sel!(onContextMenuItemClicked:), context_menu_item_clicked as extern fn(&Object, Sel, cocoa::base::id) -> ());

            let delegate_class = decl.register();
            let delegate_object: *mut Object = msg_send![delegate_class, new];
            ObjectWrapper(delegate_object)
        }
    };

}

fn dict_iterator(key: *const c_void, value: *const c_void, context: *mut c_void) {
    unsafe {
        let result_map = context.cast::<serde_json::Map<String, Value>>();
        let key_str: CFStringRef = key.cast();
        let value_type = CFGetTypeID(value.cast());

        let mut key_cstr: [c_char; 256] = [0; 256];
        CFStringGetCString(key_str, key_cstr.as_mut_ptr(), 256, kCFStringEncodingUTF8);

        if value_type == CFStringGetTypeID() {
            let value_str: CFStringRef = value.cast();
            let mut value_cstr: [c_char; 256] = [0; 256];

            CFStringGetCString(
                value_str,
                value_cstr.as_mut_ptr(),
                256,
                kCFStringEncodingUTF8,
            );

            let key_string = std::ffi::CStr::from_ptr(key_cstr.as_ptr())
                .to_str()
                .unwrap()
                .to_string();
            let value_string = std::ffi::CStr::from_ptr(value_cstr.as_ptr())
                .to_str()
                .unwrap()
                .to_string();

            (*result_map).insert(key_string, Value::String(value_string));
        } else if value_type == CFNumberGetTypeID() {
            let mut stack_value: c_long = 0;
            let value_ptr = &mut stack_value as *mut c_long;
            CFNumberGetValue(value.cast(), kCFNumberLongType, value_ptr.cast());

            let key_string = std::ffi::CStr::from_ptr(key_cstr.as_ptr())
                .to_str()
                .unwrap()
                .to_string();

            (*result_map).insert(key_string, Value::Number(stack_value.into()));
        } else if value_type == CFDictionaryGetTypeID() {
            let value_dict: CFDictionaryRef = value.cast();
            let value_map = serde_json::Map::new();

            let iterator_fn: CFDictionaryApplierFunction =
                std::mem::transmute(dict_iterator as fn(*const c_void, *const c_void, *mut c_void));
            let value_map_raw = Box::into_raw(Box::new(value_map));
            CFDictionaryApplyFunction(value_dict, iterator_fn, value_map_raw.cast());

            let key_string = std::ffi::CStr::from_ptr(key_cstr.as_ptr())
                .to_str()
                .unwrap()
                .to_string();

            (*result_map).insert(key_string, Value::Object(*Box::from_raw(value_map_raw)));
        } else if value_type == CFArrayGetTypeID() {
            let value_array: CFArrayRef = value.cast();
            let mut value_vec = Vec::new();

            let count = CFArrayGetCount(value_array);
            for i in 0..count {
                let value = CFArrayGetValueAtIndex(value_array, i);
                let value_type = CFGetTypeID(value.cast());

                if value_type == CFStringGetTypeID() {
                    let value_str: CFStringRef = value.cast();
                    let mut value_cstr: [c_char; 256] = [0; 256];

                    CFStringGetCString(
                        value_str,
                        value_cstr.as_mut_ptr(),
                        256,
                        kCFStringEncodingUTF8,
                    );

                    let value_string = std::ffi::CStr::from_ptr(value_cstr.as_ptr())
                        .to_str()
                        .unwrap()
                        .to_string();
                    value_vec.push(Value::String(value_string));
                } else if value_type == CFNumberGetTypeID() {
                    let mut stack_value: c_long = 0;
                    let value_ptr = &mut stack_value as *mut c_long;
                    CFNumberGetValue(value.cast(), kCFNumberLongType, value_ptr.cast());

                    value_vec.push(Value::Number(stack_value.into()));
                }
            }

            let key_string = std::ffi::CStr::from_ptr(key_cstr.as_ptr())
                .to_str()
                .unwrap()
                .to_string();

            (*result_map).insert(key_string, Value::Array(value_vec));
        }
    }
}

pub fn system_proxy_settings() -> Option<serde_json::Map<String, Value>> {
    unsafe {
        let dict_ref = CFNetworkCopySystemProxySettings();
        if dict_ref.is_null() {
            return None;
        }
        let result = Box::new(serde_json::Map::new());

        let iterator_fn: CFDictionaryApplierFunction =
            std::mem::transmute(dict_iterator as fn(*const c_void, *const c_void, *mut c_void));
        let result_raw = Box::into_raw(result);
        CFDictionaryApplyFunction(dict_ref, iterator_fn, result_raw.cast());

        CFRelease(dict_ref.cast::<c_void>());
        Some(*Box::from_raw(result_raw))
    }
}

pub trait WindowExt {
    #[cfg(target_os = "macos")]
    fn set_transparent_titlebar(&self, transparent: bool);
    #[cfg(target_os = "macos")]
    fn position_traffic_lights(&self, x: f64, y: f64, height: f64);
    #[cfg(target_os = "macos")]
    fn open_context_menu(&self, req: OpenContextMenuReq);
}

#[allow(non_upper_case_globals)]
const NSLayoutAttributeLeft: i32 = 1;
#[allow(non_upper_case_globals)]
const NSLayoutAttributeTop: i32 = 3;
#[allow(non_upper_case_globals)]
const NSLayoutRelationEqual: i32 = 0;

#[cfg(target_os = "macos")]
unsafe fn layout_traffic_light_button(
    title_bar_container_view: *mut Object,
    button: *mut Object,
    offset_top: f64,
    offset_left: f64,
) {
    let _: () = msg_send![button, setTranslatesAutoresizingMaskIntoConstraints: NO];
    let cls_obj = class!(NSLayoutConstraint);
    let top_constraint: *mut Object = msg_send![cls_obj, constraintWithItem: button
        attribute:NSLayoutAttributeTop
        relatedBy: NSLayoutRelationEqual
        toItem: title_bar_container_view
        attribute: NSLayoutAttributeTop
        multiplier: 1.0
        constant: offset_top];
    let _: () = msg_send![title_bar_container_view, addConstraint: top_constraint];
    let left_constraint: *mut Object = msg_send![cls_obj, constraintWithItem: button
        attribute:NSLayoutAttributeLeft
        relatedBy: NSLayoutRelationEqual
        toItem: title_bar_container_view
        attribute: NSLayoutAttributeLeft
        multiplier: 1.0
        constant: offset_left];
    let _: () = msg_send![title_bar_container_view, addConstraint: left_constraint];
}

impl<R: Runtime> WindowExt for Window<R> {
    #[cfg(target_os = "macos")]
    fn set_transparent_titlebar(&self, transparent: bool) {
        use cocoa::appkit::NSWindowTitleVisibility;

        unsafe {
            let id = self.ns_window().unwrap() as cocoa::base::id;

            let mut style_mask = id.styleMask();
            style_mask.set(
                NSWindowStyleMask::NSFullSizeContentViewWindowMask,
                transparent,
            );
            id.setStyleMask_(style_mask);

            id.setTitleVisibility_(if transparent {
                NSWindowTitleVisibility::NSWindowTitleHidden
            } else {
                NSWindowTitleVisibility::NSWindowTitleVisible
            });
            id.setTitlebarAppearsTransparent_(if transparent { YES } else { NO });

            id.setMovableByWindowBackground_(NO);
            id.setMovable_(NO)
        }
    }

    #[cfg(target_os = "macos")]
    fn position_traffic_lights(&self, x: f64, y: f64, height: f64) {
        use cocoa::appkit::{NSView, NSWindowButton};
        use cocoa::foundation::{NSPoint, NSRect, NSSize};

        let window = self.ns_window().unwrap() as cocoa::base::id;

        unsafe {
            let close = window.standardWindowButton_(NSWindowButton::NSWindowCloseButton);
            let miniaturize =
                window.standardWindowButton_(NSWindowButton::NSWindowMiniaturizeButton);
            let zoom = window.standardWindowButton_(NSWindowButton::NSWindowZoomButton);

            let title_bar_container_view = close.superview().superview();

            layout_traffic_light_button(title_bar_container_view, close, y, x);
            layout_traffic_light_button(title_bar_container_view, miniaturize, y, x + 18.0);
            layout_traffic_light_button(title_bar_container_view, zoom, y, x + 36.0);

            let custom_toolbar_p: *mut Object =
                msg_send![class!(NSTitlebarAccessoryViewController), alloc];
            let custom_toolbar: *mut Object = msg_send![custom_toolbar_p, init];
            let new_view = NSView::alloc(nil).init();
            let _: () = msg_send![new_view, setFrame: NSRect::new(NSPoint::new(0.0, 0.0), NSSize::new(0.0, height))];
            let _: () = msg_send![custom_toolbar, setView: new_view];

            let _: () = msg_send![window, addTitlebarAccessoryViewController: custom_toolbar];

            // let close_rect: NSRect = msg_send![close, frame];
            // let button_height = close_rect.size.height;

            // let title_bar_frame_height = button_height + y;
            // let mut title_bar_rect = NSView::frame(title_bar_container_view);
            // title_bar_rect.size.height = title_bar_frame_height;
            // title_bar_rect.origin.y = NSView::frame(window).size.height - title_bar_frame_height;
            // let _: () = msg_send![title_bar_container_view, setFrame: title_bar_rect];

            // let window_buttons = vec![close, miniaturize, zoom];
            // let space_between = NSView::frame(miniaturize).origin.x - NSView::frame(close).origin.x;

            // for (i, button) in window_buttons.into_iter().enumerate() {
            //     let mut rect: NSRect = NSView::frame(button);
            //     rect.origin.x = x + (i as f64 * space_between);
            //     button.setFrameOrigin(rect.origin);
            // }
        }
    }

    #[cfg(target_os = "macos")]
    fn open_context_menu(&self, req: OpenContextMenuReq) {
        use cocoa::appkit::{CGPoint};
        use cocoa::foundation::NSPoint;
        use cocoa::{
            appkit::{NSMenu, NSMenuItem},
            foundation::NSString,
        };

        unsafe {
            let window = self.ns_window().unwrap() as cocoa::base::id;
            let window_content_view = window.contentView();
            let window_content_view_frame = window_content_view.frame();

            let delegate_object = MY_DELEGATE.0.clone();

            let menu = NSMenu::new(nil);

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
}

extern fn context_menu_item_clicked(_: &Object, _: Sel, _: cocoa::base::id) {
    info!("context_menu_item_clicked");
}

