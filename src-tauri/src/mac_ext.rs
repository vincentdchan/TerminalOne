use cocoa::appkit::{NSWindow, NSWindowStyleMask};
use cocoa::base::{NO, YES};
use objc::runtime::Object;
use tauri::{Runtime, Window};

pub trait WindowExt {
    #[cfg(target_os = "macos")]
    fn set_transparent_titlebar(&self, transparent: bool);
    #[cfg(target_os = "macos")]
    fn position_traffic_lights(&self, x: f64, y: f64, height: f64);
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
        }
    }

    #[cfg(target_os = "macos")]
    fn position_traffic_lights(&self, x: f64, y: f64, height: f64) {
        use std::ptr::null_mut;

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
            let new_view = NSView::alloc(null_mut()).init();
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
}
