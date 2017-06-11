// ==UserScript==
// @version         0.2.3a
// @name            Iridium
// @namespace       https://github.com/ParticleCore
// @description     YouTube with more freedom
// @compatible      firefox
// @compatible      opera
// @icon            https://raw.githubusercontent.com/ParticleCore/Iridium/gh-pages/images/i-icon.png
// @match           *://www.youtube.com/*
// @exclude         *://www.youtube.com/tv*
// @exclude         *://www.youtube.com/embed/*
// @exclude         *://www.youtube.com/live_chat*
// @run-at          document-start
// @homepageURL     https://github.com/ParticleCore/Iridium
// @supportURL      https://github.com/ParticleCore/Iridium/wiki
// @contributionURL https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=UMVQJJFG4BFHW
// @grant           GM_getValue
// @grant           GM_setValue
// @noframes
// ==/UserScript==
(function () {
    "use strict";

    var iridium = {

        inject: function (is_userscript) {

            var i18n;
            var modules;
            var iridium_api;
            var user_settings;
            var default_language;

            default_language = {
                language: "English",
                section_titles: {
                    general: "General settings",
                    video: "Video settings",
                    about: "Information and useful links",
                    settings: "Iridium settings"
                },
                sub_section_titles: {
                    layout: "Layout",
                    thumbnails: "Thumbnails",
                    player: "Player",
                    channel: "Channel",
                    general: "General",
                    language: "Language",
                    settings: "Settings"
                },
                iridium_api: {
                    settings_button: "Iridium settings",
                    feature_link: "Find out what this does"
                }
            };

            modules = [
                {
                    options: {
                        square_avatars: {
                            id: "square_avatars",
                            section: "general",
                            sub_section: "layout",
                            type: "checkbox",
                            value: true,
                            i18n: {
                                label: "Make user images squared"
                            }
                        }
                    },
                    ini: function () {

                        iridium_api.initializeOption.call(this);

                        if (user_settings.square_avatars) {

                            document.documentElement.classList.add("iri-square-avatars");

                        } else {

                            document.documentElement.classList.remove("iri-square-avatars");

                        }

                    }
                },
                {
                    options: {
                        thumbnail_preview: {
                            id: "thumbnail_preview",
                            section: "general",
                            sub_section: "thumbnails",
                            type: "checkbox",
                            value: false,
                            i18n: {
                                label: "Preview videos by hovering the thumbnails"
                            }
                        }
                    },
                    togglePreviewMute: function (event) {

                        var preview_player;

                        if (event.which === 16 && (preview_player = document.getElementById("iri-preview-player"))) {

                            if (event.type === "keydown") {

                                preview_player.unMute();
                                preview_player.setVolume(50);

                            } else {

                                preview_player.mute();

                            }

                        }

                    },
                    setPreviewArgs: function (args) {

                        args.autoplay = 1;
                        args.controls = "0";
                        args.enablecastapi = "0";
                        args.iv_load_policy = "3";
                        args.modestbranding = "1";
                        args.mute = "1";
                        args.player_wide = "0";
                        args.rel = "0";
                        args.showinfo = "0";
                        args.vq = "small";

                        delete args.ad3_module;
                        delete args.baseUrl;
                        delete args.eventid; // excludes from watch history
                        delete args.iv_endscreen_url;
                        delete args.ppv_remarketing_url;
                        delete args.probe_url;
                        delete args.remarketing_url;
                        delete args.videostats_playback_base_url;

                    },
                    iniPreview: function (context, event) {

                        var i;
                        var args;
                        var temp;
                        var config;
                        var data_list;

                        delete context.getPreviewArgs.request;

                        args = {};
                        data_list = event.target.responseText.split("&");

                        for (i = 0; i < data_list.length; i++) {

                            temp = data_list[i].split("=");
                            args[temp[0]] = window.decodeURIComponent(temp[1]);

                        }

                        context.setPreviewArgs(args);

                        config = JSON.parse(JSON.stringify(window.yt.config_.FILLER_DATA.player));
                        config.args = args;
                        config.attrs.id = "iri-preview-player";

                        window.yt.player.Application.create("iri-video-preview", config);

                        document.addEventListener("keydown", function(event) {

                        }, false);

                    },
                    getPreviewArgs: function (video_id) {

                        var sts;
                        var xhr;
                        var params;
                        var context;

                        context = this;
                        sts = window.yt.config_.FILLER_DATA.player.sts;

                        params = [
                            "video_id=" + video_id,
                            "sts=" + sts,
                            "ps=gaming",
                            "el=detailpage",
                            "c=WEB_GAMING",
                            "cplayer=UNIPLAYER",
                            "mute=true",
                            "authuser=0"
                        ];

                        xhr = new XMLHttpRequest();
                        xhr.addEventListener("load", function (event) {

                            context.iniPreview(context, event);

                        });
                        xhr.open("GET", "/get_video_info?" + params.join("&"), true);
                        xhr.send();

                        return xhr;

                    },
                    endPreviewContainer: function (event, container, listener, xhr, timer, context, video_container, clicked) {

                        if (clicked || !container.parentNode.contains(event.toElement || event.relatedTarget)) {

                            document.removeEventListener("keydown", context.togglePreviewMute, false);
                            document.removeEventListener("keyup", context.togglePreviewMute, false);

                            container.parentNode.removeEventListener("click", listener, false);
                            container.parentNode.removeEventListener("mouseleave", listener, false);

                            if (timer) {

                                window.clearInterval(timer);

                            }

                            if ((video_container = document.getElementById("iri-video-preview"))) {

                                if (xhr) {

                                    xhr.abort();

                                }

                                if (video_container.firstChild) {

                                    video_container.firstChild.destroy();

                                }
                            }

                            if (clicked && video_container) {

                                // video_container.remove();

                            }
                        }

                    },
                    iniPreviewContainer: function (event) {

                        var xhr;
                        var timer;
                        var context;
                        var listener;
                        var video_id;
                        var container;
                        var video_container;

                        if (user_settings.thumbnail_preview) {

                            container = event.target;
                            video_id = container.dataHost && container.dataHost.data && container.dataHost.data.videoId;

                            if (container.tagName === "YT-IMG-SHADOW" && video_id && !container.querySelector("#iri-preview-player")) {

                                if (!(video_container = document.getElementById("iri-video-preview"))) {

                                    video_container = document.createElement("iri-video-preview");
                                    video_container.id = "iri-video-preview";
                                    video_container.setAttribute("class", "ytp-small-mode");

                                }

                                if (video_container.parentNode !== container) {

                                    container.appendChild(video_container);

                                }

                                if (!window.yt || !window.yt.player || !window.yt.player.Application || !window.yt.player.Application.create) {

                                    timer = window.setInterval(function () {

                                        if (window.yt && window.yt.player && window.yt.player.Application && window.yt.player.Application.create) {

                                            window.clearInterval(timer);
                                            xhr = this.getPreviewArgs(video_id);

                                        }

                                    });

                                } else {

                                    xhr = this.getPreviewArgs(video_id);

                                }

                                document.addEventListener("keydown", this.togglePreviewMute, false);
                                document.addEventListener("keyup", this.togglePreviewMute, false);

                                context = this;

                                container.parentNode.addEventListener("click", function listener(event) {

                                    context.endPreviewContainer(event, container, listener, xhr, timer, context, video_container, true);

                                }, false);

                                container.parentNode.addEventListener("mouseleave", function listener(event) {

                                    context.endPreviewContainer(event, container, listener, xhr, timer, context);

                                }, false);

                            }

                        }

                    },
                    ini: function () {

                        iridium_api.initializeOption.call(this);

                        document.addEventListener("mouseenter", this.iniPreviewContainer.bind(this), true);

                    }
                },
                {
                    options: {
                        channel_video_count: {
                            id: "channel_video_count",
                            section: "video",
                            sub_section: "general",
                            type: "checkbox",
                            value: true,
                            i18n: {
                                label: "Display uploaded videos number"
                            }
                        },
                        channel_video_time: {
                            id: "channel_video_time",
                            section: "video",
                            sub_section: "general",
                            type: "checkbox",
                            value: true,
                            i18n: {
                                label: "Display how long the video was uploaded"
                            }
                        }
                    },
                    removeVideoCount: function (xhr, listener) {

                        var video_count;
                        var video_count_dot;

                        document.removeEventListener("yt-navigate-finish", listener, false);

                        if (xhr && xhr.abort) {

                            xhr.abort();

                        }

                        if ((video_count_dot = document.querySelector("span.iri-video-count"))) {

                            video_count_dot.remove();

                        }

                        if ((video_count = document.getElementById("iri-video-count"))) {

                            video_count.remove();

                        }

                    },
                    addVideoCount: function (channel_url, event) {

                        var count_match;
                        var video_count;
                        var video_count_dot;
                        var owner_container;

                        delete this.addVideoCount.fetching;

                        count_match = event.target.response.match(/"(?:stats|briefStats)":\[{"runs":\[{"text":"([\w\W ]+?")}]}/);

                        if (count_match && (count_match = count_match[1].replace("\"", "")) && (owner_container = document.getElementById("owner-container"))) {

                            video_count_dot = document.createElement("span");
                            video_count_dot.textContent = " · ";
                            video_count_dot.setAttribute("class", "iri-video-count");

                            video_count = document.createElement("a");
                            video_count.id = "iri-video-count";
                            video_count.textContent = count_match;
                            video_count.setAttribute("class", "yt-simple-endpoint iri-video-count");
                            video_count.setAttribute("href", channel_url + "/videos");
                            video_count.data = {
                                webNavigationEndpointData: {
                                    url: channel_url + "/videos"
                                }
                            };

                            owner_container.appendChild(video_count_dot);
                            owner_container.appendChild(video_count);

                            owner_container.channel_url = channel_url;
                            owner_container.video_count = count_match;

                        }

                    },
                    removeVideoTime: function (xhr, listener) {

                        var time_container;

                        document.removeEventListener("yt-navigate-finish", listener, false);

                        if (xhr && xhr.abort) {

                            xhr.abort();

                        }

                        if ((time_container = document.getElementById("iri-video-time"))) {

                            time_container.remove();

                        }

                    },
                    addVideoTime: function (published_date, event) {

                        var time_match;
                        var time_container;

                        delete this.addVideoTime.fetching;

                        time_match = event.target.response.match(/"publishedTimeText":{"simpleText":"([\w\W ]+?")}/);

                        if (time_match && (time_match = time_match[1].replace("\"", ""))) {

                            time_container = document.createElement("span");
                            time_container.id = "iri-video-time";
                            time_container.textContent = " · " + time_match;

                            published_date.appendChild(time_container);

                        }

                    },
                    loadStart: function () {

                        var xhr;
                        var context;
                        var video_id;
                        var channel_id;
                        var channel_url;
                        var upload_info;

                        if ((channel_url = document.querySelector("#owner-name a"))) {

                            channel_url = channel_url.getAttribute("href");
                            channel_id = channel_url.match(/UC([a-z0-9-_]{22})/i);

                            if (channel_id && (channel_id = channel_id[1])) {

                                if (user_settings.channel_video_count && !this.addVideoCount.fetching && document.getElementById("owner-container") && !document.getElementById("iri-video-count") && (channel_url = document.querySelector("#owner-name a"))) {

                                    this.addVideoCount.fetching = true;
                                    channel_url = channel_url.getAttribute("href");

                                    xhr = new XMLHttpRequest();
                                    xhr.addEventListener("load", this.addVideoCount.bind(this, channel_url));
                                    xhr.open("GET", "/playlist?list=UU" + channel_id, true);
                                    xhr.send();

                                    context = this;

                                    document.addEventListener("yt-navigate-finish", function listener() {

                                        context.removeVideoCount.call(this, xhr, listener);

                                    }, false);

                                }

                                if (user_settings.channel_video_time && !this.addVideoTime.fetching && (upload_info = document.querySelector("#upload-info .date")) && upload_info.textContent.indexOf("·") === -1) {

                                    if ((video_id = window.location.href.match(/v=([\w]+)/)) && (video_id = video_id[1])) {

                                        this.addVideoTime.fetching = true;

                                        xhr = new XMLHttpRequest();
                                        xhr.addEventListener("load", this.addVideoTime.bind(this, upload_info));
                                        xhr.open("GET", "/channel/UC" + channel_id + "/search?query=%22" + video_id + "%22", true);
                                        xhr.send();

                                        context = this;

                                        document.addEventListener("yt-navigate-finish", function listener() {

                                            context.removeVideoTime.call(this, xhr, listener);

                                        }, false);

                                    }

                                }

                            }

                        }

                    },
                    ini: function () {

                        iridium_api.initializeOption.call(this);

                        document.documentElement.addEventListener("load", this.loadStart.bind(this), true);

                    }
                },
                {
                    options: {
                        player_quality: {
                            id: "player_quality",
                            section: "video",
                            sub_section: "player",
                            type: "dropdown",
                            value: "auto",
                            i18n: {
                                label: "Default video quality:"
                            },
                            options: [
                                "auto",
                                "Auto",
                                "highres",
                                "4320p (8k)",
                                "hd2880",
                                "2880p (5k)",
                                "hd2160",
                                "2160p (4k)",
                                "hd1440",
                                "1440p",
                                "hd1080",
                                "1080p",
                                "hd720",
                                "720p",
                                "large",
                                "480p",
                                "medium",
                                "360p",
                                "small",
                                "240p",
                                "tiny",
                                "144p"
                            ]
                        },
                        player_auto_play: {
                            id: "player_auto_play",
                            section: "video",
                            sub_section: "player",
                            type: "checkbox",
                            value: false,
                            i18n: {
                                label: "Play videos automatically"
                            }
                        },
                        channel_trailer_auto_play: {
                            id: "channel_trailer_auto_play",
                            section: "video",
                            sub_section: "channel",
                            type: "checkbox",
                            value: false,
                            i18n: {
                                label: "Play channel trailers automatically"
                            }
                        },
                        player_annotations: {
                            id: "player_annotations",
                            section: "video",
                            sub_section: "player",
                            type: "checkbox",
                            value: false,
                            i18n: {
                                label: "Allow annotations on videos"
                            }
                        },
                        player_ads: {
                            id: "player_ads",
                            section: "video",
                            sub_section: "player",
                            type: "checkbox",
                            value: false,
                            i18n: {
                                label: "Allow ads on videos"
                            }
                        },
                        subscribed_channel_player_ads: {
                            id: "subscribed_channel_player_ads",
                            section: "video",
                            sub_section: "player",
                            type: "checkbox",
                            value: false,
                            i18n: {
                                label: "Allow ads only on videos of subscribed channels"
                            }
                        },
                        player_hfr: {
                            id: "player_hfr",
                            section: "video",
                            sub_section: "player",
                            type: "checkbox",
                            value: true,
                            i18n: {
                                label: "Allow HFR (60fps) streams"
                            }
                        }
                    },
                    modArgs: function (args) {

                        var i;
                        var fps;
                        var list;

                        if (user_settings.subscribed_channel_player_ads ? args.subscribed !== "1" : !user_settings.player_ads) {

                            delete args.ad3_module;

                        }

                        if (!user_settings.player_annotations) {

                            args.iv_load_policy = "3";

                        }

                        if (!user_settings.player_hfr && args.adaptive_fmts) {

                            list = args.adaptive_fmts.split(",");

                            for (i = 0; i < list.length; i++) {

                                fps = list[i].split(/fps=([0-9]{2})/);
                                fps = fps && fps[1];

                                if (fps > 30) {

                                    list.splice(i--, 1);

                                }

                            }

                            args.adaptive_fmts = list.join(",");

                        }

                    },
                    modVideoByPlayerVars: function (original) {

                        var context = this;

                        return function (args) {

                            var temp;

                            context.modArgs(args);

                            temp = original.apply(this, arguments);

                            if (user_settings.player_quality !== "auto") {

                                this.setPlaybackQuality(user_settings.player_quality);

                            }

                            return temp;

                        };

                    },
                    modPlayerLoad: function (original) {

                        var context = this;

                        return function (text, reviver) {

                            var temp;
                            var player;

                            context.modArgs(this.config.args);

                            temp = original.apply(this, arguments);

                            if (user_settings.player_quality !== "auto" && (player = document.getElementById("movie_player"))) {

                                player.setPlaybackQuality(user_settings.player_quality);

                            }

                            return temp;

                        };

                    },
                    modJSONParse: function (original) {

                        var context = this;

                        return function (text, reviver) {

                            var temp = original.apply(this, arguments);

                            if (temp && temp.player && temp.player.args) {

                                context.modArgs(temp.player.args);

                            }

                            return temp;

                        };

                    },
                    modParseFromString: function (original) {

                        return function () {

                            var i;
                            var fps;
                            var result;
                            var streams;

                            if (!user_settings.player_hfr) {

                                result = original.apply(this, arguments);
                                streams = result.getElementsByTagName("Representation");
                                i = streams.length;

                                while (i--) {

                                    fps = streams[i].getAttribute("frameRate");

                                    if (fps > 30) {

                                        streams[i].remove();

                                    }

                                }

                                return result;

                            }

                            return original.apply(this, arguments);

                        };

                    },
                    isChannel: function () {

                        return /^\/(user|channel)\//.test(window.location.pathname);

                    },
                    ini: function () {

                        var context;

                        iridium_api.initializeOption.call(this);

                        context = this;

                        JSON.parse = context.modJSONParse(JSON.parse);
                        DOMParser.prototype.parseFromString = context.modParseFromString(DOMParser.prototype.parseFromString);

                        Object.defineProperties(Object.prototype, {
                            cueVideoByPlayerVars: {
                                set: function (data) {
                                    this._cueVideoByPlayerVars = data;
                                },
                                get: function () {
                                    return context.modVideoByPlayerVars(this._cueVideoByPlayerVars);
                                }
                            },
                            loadVideoByPlayerVars: {
                                set: function (data) {
                                    this._loadVideoByPlayerVars = data;
                                },
                                get: function () {

                                    if (context.isChannel() ? !user_settings.channel_trailer_auto_play : !user_settings.player_auto_play) {

                                        return this.cueVideoByPlayerVars;

                                    }

                                    return context.modVideoByPlayerVars(this._loadVideoByPlayerVars);

                                }
                            },
                            TIMING_AFT_KEYS: {
                                set: function (data) {
                                    this._TIMING_AFT_KEYS = data;
                                },
                                get: function () {

                                    var key;

                                    if (context.isChannel() ? !user_settings.channel_trailer_auto_play : !user_settings.player_auto_play) {

                                        if (window.ytcsi && window.ytcsi.data_ && window.ytcsi.data_.tick) {

                                            for (key in window.ytcsi.data_.tick) {

                                                if (window.ytcsi.data_.tick.hasOwnProperty(key)) {

                                                    return [key];

                                                }

                                            }

                                        } else {

                                            return ["srt"];

                                        }

                                    }

                                    return this._TIMING_AFT_KEYS;

                                }
                            },
                            loaded: {
                                set: function (data) {
                                    this._loaded = data;
                                },
                                get: function () {

                                    if (this.args && (context.isChannel() ? !user_settings.channel_trailer_auto_play : !user_settings.player_auto_play)) {

                                        return false;

                                    }

                                    return this._loaded;

                                }

                            },
                            load: {
                                set: function (data) {
                                    this._load = data;
                                },
                                get: function () {

                                    var temp = this._load && this._load.toString();

                                    if (temp && temp.match("Application.create")) {

                                        return context.modPlayerLoad(this._load);

                                    }

                                    return this._load;

                                }

                            },
                            autoplay: {
                                set: function (data) {
                                    this._autoplay = data;
                                },
                                get: function () {

                                    if (this.ucid && this._autoplay === "1" && (context.isChannel() ? !user_settings.channel_trailer_auto_play : !user_settings.player_auto_play)) {

                                        return "0";

                                    }

                                    return this._autoplay;

                                }

                            },
                            fflags: {
                                set: function (data) {
                                    this._fflags = data;
                                },
                                get: function () {

                                    if (this.ucid && (!this.autoplay || this.autoplay === "1") && (context.isChannel() ? !user_settings.channel_trailer_auto_play : !user_settings.player_auto_play)) {

                                        return this._fflags
                                            .replace(
                                                "legacy_autoplay_flag=true",
                                                "legacy_autoplay_flag=false"
                                            ).replace(
                                                "disable_new_pause_state3=true",
                                                "disable_new_pause_state3=false"
                                            );

                                    }

                                    return this._fflags;

                                }

                            }
                        });

                    }
                },
                {
                    options: {
                        player_always_active: {
                            id: "player_always_active",
                            section: "video",
                            sub_section: "player",
                            type: "checkbox",
                            value: true,
                            i18n: {
                                label: "Player shortcuts always active"
                            }
                        }
                    },
                    alwaysActive: function (event) {

                        var i;
                        var api;
                        var list;
                        var clear;
                        var length;
                        var event_clone;

                        if (user_settings.player_always_active && (api = document.getElementById("movie_player"))) {

                            clear = window.location.pathname === "/watch" && api && api !== event.target && !api.contains(event.target);

                            clear = clear && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey && !event.target.isContentEditable;

                            clear = clear && (event.which > 47 && event.which < 58 || event.which > 95 && event.which < 106 || [27, 32, 35, 36, 37, 38, 39, 40, 66, 67, 79, 87, 187, 189].indexOf(event.which) > -1);

                            if (clear && ["EMBED", "INPUT", "OBJECT", "TEXTAREA", "IFRAME"].indexOf(document.activeElement.tagName) === -1) {

                                event_clone = new Event("keydown");
                                list = Object.keys(Object.getPrototypeOf(event));
                                length = list.length;

                                for (i = 0; i < length; i++) {

                                    event_clone[list[i]] = event[list[i]];

                                }

                                event.preventDefault();
                                api.dispatchEvent(event_clone);

                            }

                        }

                    },
                    ini: function () {

                        iridium_api.initializeOption.call(this);

                        document.addEventListener("keydown", this.alwaysActive.bind(this));

                    }
                },
                {
                    options: {
                        player_volume_wheel: {
                            id: "player_volume_wheel",
                            section: "video",
                            sub_section: "player",
                            type: "checkbox",
                            value: false,
                            i18n: {
                                label: "Change volume using the mouse wheel"
                            }
                        }
                    },
                    changeVolume: function (event) {

                        var api;
                        var player;
                        var direction;
                        var timestamp;
                        var can_scroll;
                        var new_volume;
                        var player_state;
                        var chrome_bottom;
                        var invideo_drawer;
                        var player_settings;
                        var fullscreen_playlist;

                        api = document.getElementById("movie_player");
                        player = document.querySelector("video");
                        invideo_drawer = document.querySelector(".iv-drawer");
                        player_settings = document.querySelector(".ytp-settings-menu");
                        fullscreen_playlist = document.querySelector(".ytp-playlist-menu");
                        can_scroll = (!fullscreen_playlist || !fullscreen_playlist.contains(event.target)) && (!invideo_drawer || !invideo_drawer.contains(event.target)) && (!player_settings || !player_settings.contains(event.target));

                        if (can_scroll && player && api && api.contains(event.target)) {

                            player_state = api.getPlayerState();

                            if (player_state > 0 && player_state < 5) {

                                event.preventDefault();
                                chrome_bottom = document.querySelector(".ytp-chrome-bottom");

                                if (chrome_bottom) {

                                    if (!chrome_bottom.classList.contains("ytp-volume-slider-active")) {

                                        chrome_bottom.classList.add("ytp-volume-slider-active");

                                    }

                                    if (chrome_bottom.timer) {

                                        window.clearTimeout(chrome_bottom.timer);

                                    }

                                    api.dispatchEvent(new Event("mousemove"));

                                    chrome_bottom.timer = window.setTimeout(function () {

                                        if (chrome_bottom && chrome_bottom.classList.contains("ytp-volume-slider-active")) {

                                            chrome_bottom.classList.remove("ytp-volume-slider-active");
                                            delete chrome_bottom.timer;

                                        }

                                    }, 4000);

                                }

                                direction = event.deltaY || event.wheelDeltaY;
                                new_volume = api.getVolume() - (Math.sign(direction) * 5);

                                if (new_volume < 0) {

                                    new_volume = 0;

                                } else if (new_volume > 100) {

                                    new_volume = 100;

                                }

                                api.setVolume(new_volume);

                                timestamp = Date.now();

                                window.localStorage.setItem(
                                    "yt-player-volume",
                                    JSON.stringify({
                                        data: JSON.stringify({
                                            volume: new_volume,
                                            muted: false
                                        }),
                                        creation: timestamp,
                                        expiration: timestamp + 2592E6
                                    })
                                );

                                return false;

                            }

                        }

                    },
                    ini: function () {

                        iridium_api.initializeOption.call(this);

                        if (user_settings.player_volume_wheel) {

                            document.addEventListener("wheel", this.changeVolume.bind(this));

                        }

                    }
                },
                {
                    options: {
                        iridium_dark_mode: {
                            id: "iridium_dark_mode",
                            section: "settings",
                            sub_section: "settings",
                            type: "checkbox",
                            value: false,
                            i18n: {
                                label: "Use dark theme"
                            },
                            callback: function () {

                                if (user_settings.iridium_dark_mode) {

                                    document.documentElement.classList.add("iri-dark-mode-settings");

                                } else {

                                    document.documentElement.classList.remove("iri-dark-mode-settings");

                                }

                            }
                        }
                    }
                },
                {
                    options: {
                        iridium_user_settings: {
                            id: "iridium_user_settings",
                            section: "settings",
                            sub_section: "settings",
                            type: "custom",
                            i18n: {
                                button_save: "Save",
                                button_close: "Close",
                                button_export: "Export",
                                button_import: "Import",
                                button_reset: "Reset",
                                placeholder: "Paste your new settings here",
                                confirm_reset: "You are about to reset your settings. It is advised to backup your current settings before continuing.\n\nDo you wish to contiue?\n\n",
                                reset_success: "Settings have been reset.\n\nChanges will be applied after a page refresh.\n\n",
                                confirm_import: "You are about to override your current settings. It is advised to backup your current settings before continuing.\n\nDo you wish to contiue?\n\n",
                                import_success: "Your settings have been imported with success.\n\nChanges will be applied after a page refresh.\n\n",
                                import_error: "Your settings could not be imported because they appear to be invalid.\n\n"
                            },
                            custom: function () {

                                var element;
                                var element_list;

                                element_list = [];

                                element = document.createElement("button");
                                element.textContent = i18n.iridium_user_settings.button_export;
                                element.setAttribute("class", "setting iri-settings-button");
                                element.addEventListener("click", this.textEditor.bind(this, "export"));

                                element_list.push(element);

                                element = document.createElement("button");
                                element.textContent = i18n.iridium_user_settings.button_import;
                                element.setAttribute("class", "setting iri-settings-button");
                                element.addEventListener("click", this.textEditor.bind(this, "import"));

                                element_list.push(element);

                                element = document.createElement("button");
                                element.textContent = i18n.iridium_user_settings.button_reset;
                                element.setAttribute("class", "setting iri-settings-button danger");
                                element.addEventListener("click", this.resetSettings.bind(this));

                                element_list.push(element);

                                return element_list;

                            },
                            resetSettings: function () {

                                if (window.confirm(i18n.iridium_user_settings.confirm_reset)) {

                                    user_settings = null;

                                    iridium_api.initializeSettings();
                                    iridium_api.saveSettings();

                                    window.alert(i18n.iridium_user_settings.reset_success);

                                }

                            },
                            importSettings: function () {

                                var editor;
                                var textarea;

                                if ((textarea = document.getElementById("iridium-textarea")) && window.confirm(i18n.iridium_user_settings.confirm_import)) {

                                    try {

                                        user_settings = JSON.parse(textarea.value);

                                        iridium_api.saveSettings();

                                        window.alert(i18n.iridium_user_settings.import_success);

                                        if ((editor = document.getElementById("iridium-text-editor"))) {

                                            editor.remove();

                                        }

                                    } catch (error) {

                                        window.alert(i18n.iridium_user_settings.import_error + error.name + ": " + error.message);

                                    }

                                }

                            },
                            closeEditor: function (editor) {

                                editor.remove();

                            },
                            textEditor: function (type, event) {

                                var editor;
                                var button;
                                var textarea;
                                var buttons_section;

                                if (!(editor = document.getElementById("iridium-text-editor"))) {

                                    editor = document.createElement("div");
                                    editor.id = "iridium-text-editor";

                                    document.body.appendChild(editor);

                                } else {

                                    editor.textContent = "";

                                }

                                buttons_section = document.createElement("div");
                                buttons_section.id = "buttons-section";
                                textarea = document.createElement("textarea");
                                textarea.id = "iridium-textarea";

                                if (type === "import") {

                                    textarea.setAttribute("placeholder", i18n.iridium_user_settings.placeholder);

                                    button = document.createElement("button");
                                    button.textContent = i18n.iridium_user_settings.button_save;
                                    button.setAttribute("class", "iri-settings-button");
                                    button.addEventListener("click", this.importSettings.bind(this));

                                    buttons_section.appendChild(button);

                                }

                                button = document.createElement("button");
                                button.textContent = i18n.iridium_user_settings.button_close;
                                button.setAttribute("class", "iri-settings-button");
                                button.addEventListener("click", this.closeEditor.bind(this, editor));

                                buttons_section.appendChild(button);

                                if (type === "export") {

                                    textarea.value = JSON.stringify(user_settings, null, 4);

                                }

                                editor.appendChild(buttons_section);
                                editor.appendChild(textarea);

                            }
                        },
                        iridium_language: {
                            id: "iridium_language",
                            section: "settings",
                            sub_section: "language",
                            type: "custom",
                            i18n: {
                                button_save: "Save",
                                button_close: "Close",
                                confirm_save: "You are about to replace your extension language settings.\n\nDo you wish to continue?\n\n",
                                save_success: "New language saved successfully.\n\nChanges will be applied after a page refresh.\n\n",
                                save_error: "The new language could not be saved because it appears to be invalid.\n\n"
                            },
                            custom: function () {

                                var element;
                                var element_list;

                                element_list = [];

                                element = document.createElement("button");
                                element.textContent = i18n.language;
                                element.setAttribute("class", "setting iri-settings-button");
                                element.addEventListener("click", this.textEditor.bind(this));

                                element_list.push(element);

                                return element_list;

                            },
                            closeEditor: function (editor) {

                                editor.remove();

                            },
                            saveLanguage: function (textarea) {

                                var editor;

                                if ((textarea = document.getElementById("iridium-textarea")) && window.confirm(i18n.iridium_language.confirm_save)) {

                                    try {

                                        user_settings.custom_language = JSON.parse(textarea.value);

                                        iridium_api.setCustomLanguage(user_settings.custom_language);
                                        iridium_api.saveSettings();

                                        window.alert(i18n.iridium_language.save_success);

                                        if ((editor = document.getElementById("iridium-text-editor"))) {

                                            editor.remove();

                                        }

                                    } catch (error) {

                                        window.alert(i18n.iridium_language.save_error + error.name + ": " + error.message);

                                    }
                                }

                            },
                            textEditor: function (event) {

                                var editor;
                                var button;
                                var textarea;
                                var buttons_section;

                                if (!(editor = document.getElementById("iridium-text-editor"))) {

                                    editor = document.createElement("div");
                                    editor.id = "iridium-text-editor";

                                    document.body.appendChild(editor);

                                } else {

                                    editor.textContent = "";

                                }

                                buttons_section = document.createElement("div");
                                buttons_section.id = "buttons-section";

                                button = document.createElement("button");
                                button.textContent = i18n.iridium_language.button_save;
                                button.setAttribute("class", "iri-settings-button");
                                button.addEventListener("click", this.saveLanguage.bind(this));

                                buttons_section.appendChild(button);

                                button = document.createElement("button");
                                button.textContent = i18n.iridium_language.button_close;
                                button.setAttribute("class", "iri-settings-button");
                                button.addEventListener("click", this.closeEditor.bind(this, editor));

                                buttons_section.appendChild(button);

                                textarea = document.createElement("textarea");
                                textarea.id = "iridium-textarea";
                                textarea.value = JSON.stringify(i18n, null, 4);

                                editor.appendChild(buttons_section);
                                editor.appendChild(textarea);

                            }
                        }
                    },
                    ini: function () {

                        iridium_api.initializeOption.call(this);

                    }
                },
                {
                    options: {
                        about: {
                            id: "about",
                            section: "about",
                            type: "custom"
                        }
                    }
                }
            ];

            iridium_api = {
                setCustomLanguage: function (custom_language) {

                    var i;
                    var j;
                    var key;
                    var sub_key;

                    key = Object.keys(custom_language);

                    for (i = 0; i < key.length; i++) {

                        sub_key = Object.keys(custom_language[key[i]]);

                        if (!(key[i] in i18n)) {

                            i18n[key[i]] = custom_language[key[i]];

                        } else {

                            for (j = 0; j < sub_key.length; j++) {

                                i18n[key[i]][sub_key[j]] = custom_language[key[i]][sub_key[j]];

                            }

                        }

                    }

                },
                fillSettingsContainer: function (options_list) {

                    var i;
                    var j;
                    var temp;
                    var input;
                    var label;
                    var select;
                    var header;
                    var option;
                    var options;
                    var section;
                    var setting;
                    var help_link;
                    var sub_section;

                    if (!(section = document.getElementById("settings_sub_section"))) {

                        return;

                    }

                    section.innerHTML = "";

                    if ((header = document.getElementById("settings_section_header"))) {

                        header.textContent = i18n.section_titles[options_list[0].section];

                    }

                    for (i = 0; i < options_list.length; i++) {

                        option = options_list[i];

                        if (!(sub_section = document.getElementById(i18n.sub_section_titles[option.sub_section]))) {

                            sub_section = document.createElement("div");
                            sub_section.id = i18n.sub_section_titles[option.sub_section];

                            header = document.createElement("h3");
                            header.textContent = i18n.sub_section_titles[option.sub_section];

                            sub_section.appendChild(header);
                            section.appendChild(sub_section);

                        }

                        setting = document.createElement("div");
                        setting.setAttribute("class", "settings_setting");

                        switch (option.type) {

                            case "checkbox":

                                input = document.createElement("input");
                                input.setAttribute("class", "setting");
                                input.id = option.id;
                                input.type = option.type;
                                input.checked = user_settings[option.id];

                                label = document.createElement("label");
                                label.textContent = i18n[option.id].label;
                                label.setAttribute("class", "setting");
                                label.setAttribute("for", option.id);

                                setting.appendChild(input);
                                setting.appendChild(label);

                                if (option.callback) {

                                    input.callback = option.callback;

                                }

                                break;

                            case "dropdown":

                                label = document.createElement("label");
                                label.textContent = i18n[option.id].label;
                                label.setAttribute("class", "setting");
                                label.setAttribute("for", option.id);

                                select = document.createElement("select");
                                select.id = option.id;
                                select.setAttribute("class", "iri-settings-button");

                                for (j = 0; j < option.options.length; j++) {

                                    options = document.createElement("option");
                                    options.value = option.options[j++];
                                    options.textContent = option.options[j];

                                    if (user_settings[option.id] === options.value) {

                                        options.setAttribute("selected", "true");

                                    }

                                    select.appendChild(options);
                                }

                                setting.appendChild(label);
                                setting.appendChild(select);

                                break;

                            case "custom":

                                if (option.custom) {

                                    temp = option.custom();

                                    for (j = 0; j < temp.length; j++) {

                                        setting.appendChild(temp[j]);

                                    }

                                }

                                break;

                        }

                        if (option.type !== "custom") {

                            help_link = document.createElement("a");
                            help_link.textContent = "?";
                            help_link.href = "https://github.com/ParticleCore/Iridium/wiki/Features#" + option.id;
                            help_link.setAttribute("title", i18n.iridium_api.feature_link);
                            help_link.setAttribute("class", "feature-link");
                            help_link.setAttribute("target", "features");

                            setting.appendChild(help_link);

                        }

                        sub_section.appendChild(setting);

                    }

                },
                loadSelectedSection: function () {

                    var name;
                    var option;
                    var active_id;
                    var options_list;
                    var active_sidebar;

                    if (!(active_sidebar = document.querySelector(".sidebar_section.active_sidebar"))) {

                        return;

                    }

                    active_id = active_sidebar.dataset.section;
                    options_list = [];

                    for (i = 0; i < modules.length; i++) {

                        if (modules[i].options) {

                            for (name in modules[i].options) {

                                if (modules[i].options.hasOwnProperty(name)) {

                                    option = modules[i].options[name];

                                    if (option.section === active_id) {

                                        options_list.push(option);

                                    }

                                }

                            }

                        }

                    }

                    iridium_api.fillSettingsContainer(options_list);

                },
                updateSidebarSelection: function (event) {

                    var next;
                    var current;
                    var sidebar_current;

                    if (event.target.dataset.section) {

                        current = document.querySelector(".active_sidebar");
                        next = document.getElementById("sidebar_" + event.target.dataset.section);

                        if (next !== current) {

                            if ((sidebar_current = document.querySelector(".active_sidebar"))) {

                                sidebar_current.classList.remove("active_sidebar");

                            }

                            event.target.classList.add("active_sidebar");

                            iridium_api.loadSelectedSection();

                        }

                    }

                },
                settingsBuilder: function (option) {

                    var header;
                    var divider;
                    var section;
                    var sub_section;
                    var sidebar_section;
                    var settings_sidebar;
                    var settings_container;

                    if (!(settings_sidebar = document.getElementById("iridium_settings_sidebar"))) {

                        settings_sidebar = document.createElement("div");
                        settings_sidebar.id = "iridium_settings_sidebar";

                        document.body.appendChild(settings_sidebar);

                    }

                    if (!(sidebar_section = document.getElementById("sidebar_" + option.section))) {

                        sidebar_section = document.createElement("div");
                        sidebar_section.id = "sidebar_" + option.section;
                        sidebar_section.textContent = option.section;
                        sidebar_section.dataset.section = option.section;

                        sidebar_section.setAttribute("class", "sidebar_section");
                        settings_sidebar.appendChild(sidebar_section);

                    }

                    if (!(settings_container = document.getElementById("iridium_settings_container"))) {

                        settings_container = document.createElement("div");
                        settings_container.id = "iridium_settings_container";

                        if (!(section = document.getElementById("settings_section"))) {

                            header = document.createElement("h2");
                            header.id = "settings_section_header";

                            divider = document.createElement("div");
                            divider.setAttribute("class", "settings_divider");

                            section = document.createElement("div");
                            section.id = "settings_section";

                            section.addEventListener("change", iridium_api.autoSaveSettings, true);
                            section.appendChild(header);
                            section.appendChild(divider);

                            settings_container.appendChild(section);

                        }

                        if (!(sub_section = document.getElementById("settings_sub_section"))) {

                            sub_section = document.createElement("div");
                            sub_section.id = "settings_sub_section";

                            section.appendChild(sub_section);

                        }

                        document.body.appendChild(settings_container);

                    }

                    if (!document.querySelector(".active_sidebar")) {

                        sidebar_section.classList.add("active_sidebar");

                    }

                },
                loadSettingsMenu: function () {

                    var i;
                    var name;
                    var title;
                    var option;

                    if (document.head) {

                        document.head.textContent = "";

                    } else {

                        document.documentElement.appendChild(document.createElement("head"));

                    }

                    if (document.body) {

                        document.body.textContent = "";

                    } else {

                        document.documentElement.appendChild(document.createElement("body"));

                    }

                    if (!(title = document.querySelector("title"))) {

                        title = document.createElement("title");

                        document.head.appendChild(title);

                    }

                    title.textContent = i18n.iridium_api.settings_button;
                    document.body.id = "iridium_settings";
                    document.body.style.display = "none";

                    for (i = 0; i < modules.length; i++) {

                        if (modules[i].options) {

                            for (name in modules[i].options) {

                                if (modules[i].options.hasOwnProperty(name)) {

                                    option = modules[i].options[name];
                                    iridium_api.settingsBuilder(option);

                                }

                            }

                        }

                    }

                    document.addEventListener("click", iridium_api.updateSidebarSelection);

                    iridium_api.loadSelectedSection();

                },
                autoSaveSettings: function (event) {

                    switch (event.target.type) {

                        case "checkbox":

                            user_settings[event.target.id] = event.target.checked;

                            break;

                        case "select-one":

                            user_settings[event.target.id] = event.target.value;

                            break;

                    }

                    if (event.target.callback) {

                        event.target.callback();

                    }

                    iridium_api.saveSettings();

                },
                saveSettings: function () {

                    document.documentElement.dataset.iridium_save_settings = JSON.stringify(user_settings);

                },
                initializeSettings: function () {

                    var i;
                    var option;
                    var options;

                    user_settings = JSON.parse(document.documentElement.dataset.iridium_user_settings || "{}");

                    if (document.documentElement.dataset.iridium_user_settings) {

                        document.documentElement.removeAttribute("data-iridium_user_settings");

                    }

                    i18n = default_language;

                    if (user_settings.custom_language) {

                        iridium_api.setCustomLanguage(user_settings.custom_language);

                    }

                    for (i = 0; i < modules.length; i++) {

                        for (options in modules[i].options) {

                            if (modules[i].options.hasOwnProperty(options)) {

                                option = modules[i].options[options];

                                if (!(option.id in user_settings) && "value" in option) {

                                    user_settings[option.id] = option.value;

                                }

                                if (option.i18n) {

                                    i18n[option.id] = option.i18n;

                                }

                            }

                        }

                    }

                },
                initializeSettingsButton: function () {

                    var buttons;
                    var iridium_settings_button;

                    buttons = document.querySelector("#end #buttons");

                    if (buttons && !(iridium_settings_button = document.getElementById("iridium_settings_button"))) {

                        iridium_settings_button = document.createElement("a");
                        iridium_settings_button.id = "iridium_settings_button";
                        iridium_settings_button.href = "/iridium-settings";
                        iridium_settings_button.target = "_blank";
                        iridium_settings_button.title = i18n.iridium_api.settings_button;
                        iridium_settings_button.innerHTML =
                            "<svg viewBox='0 0 24 24' style='height:24px;'>" +
                            "    <radialGradient id='iri-gradient' gradientUnits='userSpaceOnUse' cx='6' cy='22' r='18.5'>" +
                            "        <stop class='iri-start-gradient' offset='0'/>" +
                            "        <stop class='iri-stop-gradient' offset='1'/>" +
                            "    </radialGradient>" +
                            "    <polygon points='24,11.8 6,1.6 6,22'/>" +
                            "    <path d='M6,1.6V22l18-10.2L6,1.6z M9,6.8l9,5.1L9,17V6.8z'/>" +
                            "</svg>";
                        buttons.parentNode.insertBefore(iridium_settings_button, buttons);

                        document.documentElement.removeEventListener("load", iridium_api.initializeSettingsButton, true);

                    }

                },
                initializeModules: function () {

                    var i;
                    var timestamp;

                    for (i = 0; i < modules.length; i++) {

                        if (modules[i].ini) {

                            modules[i].ini();

                        }

                    }

                    if (user_settings.player_quality !== "auto") {

                        timestamp = Date.now();

                        window.localStorage.setItem(
                            "yt-player-quality",
                            JSON.stringify({
                                data: user_settings.player_quality,
                                creation: timestamp,
                                expiration: timestamp + 2592E6
                            })
                        );

                    }

                },
                initializeOption: function () {

                    var key;

                    if (this.started) {

                        return;

                    }

                    this.started = true;

                    for (key in this.options) {

                        if (this.options.hasOwnProperty(key)) {

                            if (!(key in user_settings) && this.options[key].value) {

                                user_settings[key] = this.options[key].value;

                            }

                        }

                    }

                },
                ini: function () {

                    iridium_api.initializeSettings();

                    if (window.location.pathname === "/iridium-settings") {

                        iridium_api.loadSettingsMenu();

                        if (user_settings.iridium_dark_mode) {

                            document.documentElement.classList.add("iri-dark-mode-settings");

                        }

                    } else {

                        iridium_api.initializeModules();

                    }

                    document.documentElement.addEventListener("load", iridium_api.initializeSettingsButton, true);

                }

            };

            iridium_api.ini();

        },
        contentScriptMessages: function () {

            var key1;
            var key2;
            var gate;
            var sets;
            var locs;
            var observer;

            key1 = "iridium_save_settings";
            key2 = "getlocale";
            gate = document.documentElement;
            sets = JSON.parse(gate.dataset[key1] || null);
            locs = gate.dataset[key2] || null;

            if (!gate.contentscript) {

                gate.contentscript = true;
                observer = new MutationObserver(iridium.contentScriptMessages);

                return observer.observe(gate, {
                    attributes: true,
                    attributeFilter: ["data-" + key1, "data-" + key2]
                });

            }

            if (sets) {

                if (iridium.is_userscript) {

                    iridium.GM_setValue(iridium.id, JSON.stringify(sets));

                } else {

                    chrome.storage.local.set({iridiumSettings: sets});

                }

                document.documentElement.removeAttribute("data-iridium_save_settings");

            } else if (locs) {

                document.documentElement.dataset.setlocale = chrome.i18n.getMessage(locs);

            }

        },
        filterChromeKeys: function (keys) {

            if (keys[iridium.id] && keys[iridium.id].new_value) {

                document.documentElement.dataset.iridium_load_settings = JSON.stringify(
                    (keys[iridium.id].new_value && keys[iridium.id].new_value[iridium.id]) || keys[iridium.id].new_value || {}
                );

            }

        },
        main: function (event) {

            var holder;

            if (!event && iridium.is_userscript) {

                event = JSON.parse(iridium.GM_getValue(iridium.id, "{}"));

            }

            if (event) {

                event = JSON.stringify(event[iridium.id] || event);
                document.documentElement.dataset.iridium_user_settings = event;

                if (iridium.is_userscript) {

                    holder = document.createElement("link");
                    holder.rel = "stylesheet";
                    holder.type = "text/css";
                    holder.href = "https://particlecore.github.io/Iridium/css/Iridium.css?v=0.2.3a";
                    document.documentElement.appendChild(holder);

                }

                holder = document.createElement("script");
                holder.textContent = "(" + iridium.inject + "(" + iridium.is_userscript + "))";
                document.documentElement.appendChild(holder);
                holder.remove();

                if (!iridium.is_userscript) {

                    chrome.storage.onChanged.addListener(iridium.filterChromeKeys);

                }

            }

        },
        ini: function () {

            if (window.location.pathname === "/iridium-settings") {

                window.stop();

            }

            iridium.id = "iridiumSettings";
            iridium.is_userscript = typeof GM_info === "object";

            if (iridium.is_userscript) {

                iridium.GM_getValue = GM_getValue;
                iridium.GM_setValue = GM_setValue;
                iridium.main();

            } else {

                chrome.storage.local.get(iridium.id, iridium.main);

            }

            iridium.contentScriptMessages();

        }

    };

    iridium.ini();
}());
