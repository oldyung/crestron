/*jslint es6 */
/*global serviceModule, CrComLib */

const page1Module = (() => {
    'use strict';

    // BEGIN::CHANGEAREA - your javascript for page module code goes here

    var currentPage = 'page-logo';
    var previousPage = null;
    var currentSource = { pres: 'No Source', vc: 'No Source' };
    var micMuted = false;
    var volMuted = false;
    var volumeLevel = 60;

    function pulseDigital(join) {
        if (typeof CrComLib === 'undefined') return;
        CrComLib.publishEvent('b', join.toString(), true);
        setTimeout(function () { CrComLib.publishEvent('b', join.toString(), false); }, 50);
    }

    function navigateTo(pageId) {
        if (currentPage !== 'page-system-off') previousPage = currentPage;
        var container = document.querySelector('#page1-page');
        container.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
        var target = container.querySelector('#' + pageId);
        if (target) { target.classList.add('active'); currentPage = pageId; }
        var nav = container.querySelector('#bottom-nav');
        if (nav) nav.classList.toggle('hide-nav', pageId === 'page-logo' || pageId === 'page-system-off');
        updateNavState(pageId);
        closeAllOverlays();
    }

    function updateNavState(pageId) {
        var container = document.querySelector('#page1-page');
        container.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.remove('active'); });
        if (pageId === 'page-logo' || pageId === 'page-system-off') return;
        var map = { 'page-home': 'home', 'page-presentation': 'presentation', 'page-vc': 'vc' };
        var btn = container.querySelector('.nav-btn[data-nav="' + (map[pageId] || 'home') + '"]');
        if (btn) btn.classList.add('active');
    }

    function selectSource(mode, source) {
        currentSource[mode] = source;
        var st = document.getElementById(mode + '-source-text');
        if (st) st.textContent = source;
        var map = { pres: { roompc: 200, hdmi: 201, clickshare: 202 }, vc: { roompc: 300, hdmi: 301, clickshare: 302 } };
        var key = (source.split(' ')[2] || '').toLowerCase();
        var jn = map[mode] && map[mode][key];
        if (jn) pulseDigital(jn);
    }

    function toggleOverlay(id) {
        var container = document.querySelector('#page1-page');
        var o = container.querySelector('#' + id);
        if (!o) return;
        closeAllOverlays();
        if (o.style.display === 'none' || o.style.display === '') {
            o.style.display = 'flex';
            updateNavForOverlay(id);
            disableNavButtons(true);
        } else {
            o.style.display = 'none';
            disableNavButtons(false);
        }
    }

    function closeOverlayFromBackdrop(ev, id) {
        if (ev.target === ev.currentTarget) closeOverlay(id);
    }

    function closeOverlay(id) {
        var container = document.querySelector('#page1-page');
        container.querySelector('#' + id).style.display = 'none';
        disableNavButtons(false);
        resetNavState();
    }

    function disableNavButtons(v) {
        var container = document.querySelector('#page1-page');
        container.querySelectorAll('.nav-btn').forEach(function (b) {
            b.style.pointerEvents = v ? 'none' : 'auto';
            b.style.opacity = v ? '0.5' : '1';
        });
    }

    function handleNavClick(ev) {
        var container = document.querySelector('#page1-page');
        var btn = ev.target.closest('.nav-btn');
        if (!btn || btn.style.pointerEvents === 'none') return;
        var a = btn.dataset.action;
        if (!a) return;
        if (a === 'power') { navigateTo('page-system-off'); pulseDigital(2); }
        else if (a === 'home') { closeAllOverlays(); navigateTo('page-home'); }
        else if (['mic', 'volume', 'blinds', 'lighting', 'equipment'].indexOf(a) >= 0) {
            toggleOverlay('overlay-' + a);
        }
    }

    function closeAllOverlays() {
        var container = document.querySelector('#page1-page');
        container.querySelectorAll('.overlay').forEach(function (o) { o.style.display = 'none'; });
        resetNavState();
    }

    function updateNavForOverlay(id) {
        var container = document.querySelector('#page1-page');
        container.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.remove('active'); });
        var map = { 'overlay-mic': 'mic', 'overlay-volume': 'volume', 'overlay-blinds': 'blinds', 'overlay-lighting': 'lighting', 'overlay-equipment': 'equipment' };
        var btn = container.querySelector('.nav-btn[data-nav="' + (map[id] || '') + '"]');
        if (btn) btn.classList.add('active');
    }

    function resetNavState() { updateNavState(currentPage); }

    function toggleMicMute() {
        micMuted = !micMuted;
        var container = document.querySelector('#page1-page');
        var btn = container.querySelector('.mic-panel .mute-btn');
        if (btn) {
            btn.classList.toggle('active', micMuted);
            btn.textContent = micMuted ? 'UNMUTE' : 'MUTE';
        }
        if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('b', '400', micMuted);
    }

    function volumeUp() {
        if (volumeLevel < 100) {
            volumeLevel += 5;
            updateVolumeDisplay();
            pulseDigital(500);
            if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '1', volumeLevel);
        }
    }

    function volumeDown() {
        if (volumeLevel > 0) {
            volumeLevel -= 5;
            updateVolumeDisplay();
            pulseDigital(501);
            if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('n', '1', volumeLevel);
        }
    }

    function toggleVolMute() {
        volMuted = !volMuted;
        var container = document.querySelector('#page1-page');
        var btn = container.querySelector('.volume-panel .mute-btn');
        if (btn) {
            btn.classList.toggle('active', volMuted);
            btn.textContent = volMuted ? 'UNMUTE' : 'MUTE';
        }
        if (typeof CrComLib !== 'undefined') CrComLib.publishEvent('b', '502', volMuted);
    }

    function updateVolumeDisplay() {
        var fill = document.getElementById('volume-fill');
        var thumb = document.getElementById('volume-thumb');
        if (fill && thumb) {
            fill.style.height = volumeLevel + '%';
            thumb.style.bottom = volumeLevel + '%';
            var color = volumeLevel >= 80 ? '#c0392b' : volumeLevel > 60 ? '#f1c40f' : '#4a90d9';
            fill.style.background = color;
            thumb.style.borderColor = color;
        }
    }

    function blindsControl(action) {
        var container = document.querySelector('#page1-page');
        var btns = container.querySelectorAll('.blind-btn');
        btns.forEach(function (b) { b.classList.remove('active'); });
        btns.forEach(function (b) { if (b.textContent.toLowerCase().indexOf(action) >= 0) b.classList.add('active'); });
        var map = { up: 600, stop: 601, down: 602 };
        var jn = map[action];
        if (jn) pulseDigital(jn);
        if (action !== 'stop') setTimeout(function () { pulseDigital(601); }, 3000);
    }

    function lightingControl(type, action) {
        var map = { led_on: 700, led_off: 701, downlight_on: 702, downlight_off: 703 };
        var jn = map[type + '_' + action];
        if (jn) pulseDigital(jn);
    }

    function equipmentControl(type, action) {
        var map = { tv_on: 800, tv_off: 801 };
        var jn = map[type + '_' + action];
        if (jn) pulseDigital(jn);
    }

    function systemOffConfirm(confirmed) {
        if (confirmed) navigateTo('page-logo');
        else navigateTo(previousPage || 'page-home');
    }

    function systemOn() {
        pulseDigital(1);
        navigateTo('page-home');
    }

    function onInit() {
        updateVolumeDisplay();
        navigateTo('page-logo');
        CrComLib.subscribeState('s', '1', function (v) {
            currentSource.pres = v;
            var st = document.getElementById('pres-source-text');
            if (st) st.textContent = v;
        });
        CrComLib.subscribeState('s', '2', function (v) {
            currentSource.vc = v;
            var st = document.getElementById('vc-source-text');
            if (st) st.textContent = v;
        });
        CrComLib.subscribeState('n', '1', function (v) {
            volumeLevel = v;
            updateVolumeDisplay();
        });
        CrComLib.subscribeState('s', '3', function (v) {
            volumeLevel = parseInt(v, 10) || 0;
            updateVolumeDisplay();
        });
        CrComLib.subscribeState('b', '400', function (v) {
            micMuted = v;
            var container = document.querySelector('#page1-page');
            var btn = container.querySelector('.mic-panel .mute-btn');
            if (btn) {
                btn.classList.toggle('active', micMuted);
                btn.textContent = micMuted ? 'UNMUTE' : 'MUTE';
            }
        });
        CrComLib.subscribeState('b', '502', function (v) {
            volMuted = v;
            var container = document.querySelector('#page1-page');
            var btn = container.querySelector('.volume-panel .mute-btn');
            if (btn) {
                btn.classList.toggle('active', volMuted);
                btn.textContent = volMuted ? 'UNMUTE' : 'MUTE';
            }
        });
        CrComLib.subscribeState('s', '4', function (v) {
            document.querySelectorAll('.room-name, .logo-full-room').forEach(function (el) { el.textContent = v; });
        });
    }

    /**
     * private method for page class initialization
     */
    let loadedSubId = CrComLib.subscribeState('o', 'ch5-import-htmlsnippet:page1-import-page', (value) => {
        if (value['loaded']) {
            onInit();
            setTimeout(() => {
                CrComLib.unsubscribeState('o', 'ch5-import-htmlsnippet:page1-import-page', loadedSubId);
                loadedSubId = '';
            });
        }
    });

    /**
     * All public method and properties are exported here
     */
    return {
        navigateTo: navigateTo,
        selectSource: selectSource,
        toggleOverlay: toggleOverlay,
        closeOverlayFromBackdrop: closeOverlayFromBackdrop,
        closeOverlay: closeOverlay,
        handleNavClick: handleNavClick,
        toggleMicMute: toggleMicMute,
        volumeUp: volumeUp,
        volumeDown: volumeDown,
        toggleVolMute: toggleVolMute,
        blindsControl: blindsControl,
        lightingControl: lightingControl,
        equipmentControl: equipmentControl,
        systemOffConfirm: systemOffConfirm,
        systemOn: systemOn
    };

    // END::CHANGEAREA

})();
