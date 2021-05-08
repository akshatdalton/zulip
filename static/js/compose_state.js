import $ from "jquery";

import * as compose_pm_pill from "./compose_pm_pill";

let message_type = false; // 'stream', 'private', or false-y

export function set_message_type(msg_type) {
    message_type = msg_type;
}

export function get_message_type() {
    return message_type;
}

export function composing() {
    // This is very similar to get_message_type(), but it returns
    // a boolean.
    return Boolean(message_type);
}

function get_or_set(fieldname, keep_leading_whitespace) {
    // We can't hoist the assignment of 'elem' out of this lambda,
    // because the DOM element might not exist yet when get_or_set
    // is called.
    return function (newval) {
        const elem = $(`#${CSS.escape(fieldname)}`);
        const oldval = elem.val();
        if (newval !== undefined) {
            elem.val(newval);
        }
        return keep_leading_whitespace ? oldval.trimEnd() : oldval.trim();
    };
}

// TODO: Break out setters and getter into their own functions.
export const stream_name = get_or_set("stream_message_recipient_stream");

export const topic = get_or_set("stream_message_recipient_topic");

// We can't trim leading whitespace in `compose_textarea` because
// of the indented syntax for multi-line code blocks.
export const message_content = get_or_set("compose-textarea", true);

export function focus_in_empty_compose() {
    return composing() && message_content() === "" && $("#compose-textarea").is(":focus");
}

export function private_message_recipient(value) {
    if (typeof value === "string") {
        compose_pm_pill.set_from_emails(value);
        return undefined;
    }
    return compose_pm_pill.get_emails();
}

export function has_message_content() {
    return message_content() !== "";
}

export function construct_message_data(saved_message_content) {
    let content;
    const msg_type = get_message_type();
    if (saved_message_content !== undefined) {
        // If we have `saved_message_content` then this implies that
        // `message_content()` is empty and this value was saved
        // at a point back in time.
        content = saved_message_content;
    } else if (msg_type) {
        // message type may not be valid in some cases when it is called in
        // `reload.js` in such case we wish not to send any message there.
        content = message_content();
    }

    const message = {
        type: msg_type,
        content,
    };
    if (msg_type === "private") {
        const recipient = private_message_recipient();
        message.reply_to = recipient;
        message.private_message_recipient = recipient;
    } else if (msg_type === "stream") {
        message.stream = stream_name();
        message.topic = topic();
    }
    return message;
}
