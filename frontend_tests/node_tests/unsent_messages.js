"use strict";

const {strict: assert} = require("assert");

const {stub_templates} = require("../zjsunit/handlebars");
const {mock_cjs, mock_esm, set_global, zrequire, with_overrides} = require("../zjsunit/namespace");
const {run_test} = require("../zjsunit/test");
const $ = require("../zjsunit/zjquery");

const compose = mock_esm("../../static/js/compose");

const ls_container = new Map();
const noop = () => {};

const localStorage = set_global("localStorage", {
    getItem(key) {
        return ls_container.get(key);
    },
    setItem(key, val) {
        ls_container.set(key, val);
    },
    removeItem(key) {
        ls_container.delete(key);
    },
    clear() {
        ls_container.clear();
    },
});
mock_cjs("jquery", $);

const compose_actions = zrequire("compose_actions");
const compose_state = zrequire("compose_state");
const {localstorage} = zrequire("localstorage");
const unsent_messages = zrequire("unsent_messages");

const KEY = "unsent_messages";

const unsent_message_1 = {
    type: "stream",
    content: "An important meeting at 5",
    stream: "Denmark",
    topic: "New topic",
}

const unsent_message_2 = {
    type: "private",
    content: "foo **bar**",
    reply_to: "aaron@zulip.com",
    private_message_recipient: "aaron@zulip.com",
}

const unsent_message_3 = {
    type: "stream",
    content: "Let's take a lunch break",
    stream: "Rome",
    topic: "bar",
}

const unsent_message_4 = {
    type: "private",
    content: "We need to discuss about the project",
    reply_to: "aaron@zulip.com",
    private_message_recipient: "aaron@zulip.com",
}


function test(label, f) {
    run_test(label, (override) => {
        localStorage.clear();
        f(override);
    });
}

test("unsent_message add", (override) => {
    const ls = localstorage();
    assert.equal(ls.get(KEY), undefined);

    override(Date, "now", () => 1);
    const expected = unsent_message_1;
    expected.createdAt = 1;
    override(compose_state, "construct_message_data", () => unsent_message_1);
    unsent_messages.store_unsent_message();
    assert.deepEqual(unsent_messages.get_unsent_messages(), [expected]);
});

test("initialize", (override) => {
    const ls = localstorage();
    assert.equal(ls.get(KEY), undefined);

    override(Date, "now", () => 1);
    const expected = unsent_message_1;
    expected.createdAt = 1;
    override(compose_state, "construct_message_data", () => unsent_message_1);
    unsent_messages.store_unsent_message();
    assert.deepEqual(unsent_messages.get_unsent_messages(), [expected]);

    
    let actual_msg_type, actual_opts;
    override(compose_actions, "start", (msg_type, opts) => {
        actual_msg_type = msg_type;
        actual_opts = opts;
    });


    unsent_messages.send_unsent_messages();
    assert.equal(actual_msg_type, "stream");
    delete expected.type;
    delete expected.createdAt;
    expected.private_message_recipient = "";
    assert.deepEqual(actual_opts, expected);

    let compose_finish_called = false;
    compose.finish = () => {
        compose_finish_called = true
    };

    assert(compose_finish_called);
});


