/*
 ********************************************************************
 * Licensed Materials - Property of HCL                             *
 *                                                                  *
 * Copyright HCL Software 2020. All Rights Reserved.                *
 *                                                                  *
 * Note to US Government Users Restricted Rights:                   *
 *                                                                  *
 * Use, duplication or disclosure restricted by GSA ADP Schedule    *
 *                                                                  *
 * Author: Emmanuel Palogan                                         *
 ********************************************************************
 */

import { LANG_LIST, VERSION_LIST, PROD_LANG_LIST } from './constants.js'
import { initMailLink } from './mail.js'
import { initTwitterLink } from './twitter.js'
import { I18N } from './lang.js'

const LNG_IDX = 3;
const VER_IDX = 2;
const LND_IDX = 1;
const LANGUAGE = "Language";
const VERSION = "Version";
const PAGE_IDX_LOC = "index.html";
const ENABLE_LANG_EN = false; // This should be the same configuration for all the languages. DISABLED FEATURE
let selectedLang = "en";
let requestSuccess = false;

$(function () {
    initSwitchers();
    fillLanguageItems();
    fillVersionItems();
    setTooltip();
    initMailLink();
    initTwitterLink();
    initEvents();
    initLabels();
});

function initLabels(){
  // this should be called after filling the language.  
  let version = document.getElementById("versions");
  let language = document.getElementById("languages");

  if (language !== null) language.title = I18N[selectedLang]["switcher.language.tooltip"];
  if (version !== null) version.title = I18N[selectedLang]["switcher.version.tooltip"];
}

function initSwitchers() {
    if (PROD_LANG_LIST.length < 1) {
        $(".language-container").remove();
    }

    if (Object.getOwnPropertyNames(VERSION_LIST).length < 2) {
        $(".version-container").remove();
    }
}

function initEvents() {
    let version = document.getElementById("versions");
    let language = document.getElementById("languages");
    if (language !== null) language.onchange = changeLanguage
    if (version !== null) version.onchange = changeVersion
}

function fillVersionItems() {
    let sel = document.getElementById("versions");
    if (sel !== null) {
        let currentPath = document.location.pathname
        let p = currentPath.split('/')
        let verLoc = p[VER_IDX];
        let ver = VERSION_LIST[verLoc];

        for (let v in VERSION_LIST) {
            let option = createOptionItem(sel, 'v-' + v, v, VERSION_LIST[v])
            if (ver !== undefined && verLoc === v) {
                option.selected = 'true';
            }
        }
    }
}

function fillLanguageItems() {
    let sel = document.getElementById("languages");
    if (sel !== null) {
        let currentPath = document.location.pathname
        let p = currentPath.split('/')
        let langLoc = p[LNG_IDX];
        let lng = LANG_LIST[langLoc];
        let hasSelected = false;

        PROD_LANG_LIST.forEach(function (value, index, arr) {
            let option = createOptionItem(sel, 'lang_' + value, value, LANG_LIST[value])
            if (lng !== undefined && langLoc === value) {
                option.selected = 'true';
                selectedLang = value
                hasSelected = true
            }
        });

        if (hasSelected === false) {
            document.getElementById("lang_en").selected = 'true';
        }
    }

}

function createOptionItem(selectElement, id, value, text) {
    let option = document.createElement("option");
    option.text = text;
    option.value = value;
    option.id = id;
    selectElement.add(option);

    return option;
}

function changeVersion() {
    let ver = document.getElementById("versions").value;
    if (ver !== null && ver !== undefined && ver !== '' && ver !== "0") {
        let domain = document.location.origin
        let currentPath = getCurrentPath(VER_IDX, VERSION_LIST)
        let currentPathLang = getCurrentPath(LNG_IDX, LANG_LIST)
        let base_url = getBaseURL(VER_IDX)
        let baseLang_url = getBaseURL(LNG_IDX)
        let currentPage = currentPath.replace(base_url, "")
        let currentPageLang = currentPathLang.replace(baseLang_url, "")
        currentPageLang = (selectedLang === 'en' && ENABLE_LANG_EN) ? currentPageLang.replace('/en', '') : currentPageLang + 'en/'
        let verDir = "/" + ver
        let search = document.location.search
        let rootEnLangUrl = domain + base_url + verDir + currentPageLang + search
        let verUrl = domain + base_url + verDir + currentPage + search

        if(selectedLang === 'en') sendRequest(rootEnLangUrl, LANGUAGE, false);
        sendRequest(verUrl, VERSION, true);
    } 
    else if (ver === "0") {
        let domain = document.location.origin
        let pathnames = document.location.pathname.split('/')
        let prodLandingURL = domain + "/" 
        
        pathnames.forEach(function (value, index, arr){
            if (index <= LND_IDX && index > 0) {
                prodLandingURL += value + "/"
            }
        })
        
        prodLandingURL += PAGE_IDX_LOC

        sendRequest(prodLandingURL, VERSION, true);
    }
    else {
        alert("Version undefined. Please check version reference.")
    }
}

function changeLanguage() {
    let defaultLang = "en"
    let lang = document.getElementById("languages").value;
    if (lang !== null && lang !== undefined && lang !== '') {

        let domain = document.location.origin
        let currentPath = getCurrentPath(LNG_IDX, LANG_LIST)
        let base_url = getBaseURL(LNG_IDX)
        let currentPage = currentPath.replace(base_url, "")
        let langDir = (lang === defaultLang && !ENABLE_LANG_EN) ? "" : "/" + lang
        let search = document.location.search
        let langUrl = domain + base_url + langDir + currentPage + search

        sendRequest(langUrl, LANGUAGE, true);
    } else {
        alert("Language undefined. Please check language reference.")
    }
}

function sendRequest(urlDest, requestType, doAlert) {
    let request = new XMLHttpRequest()
    console.log('Sending Request for ' + urlDest)
    request.onreadystatechange = function () {
        if (this.readyState === this.DONE) {
            let msg = (requestType === VERSION) ? 'Translation is not available for the selected version!' : requestType + ' does not exist!';
            let isSoft404 = isPageNotFound(request.responseText)
            if (request.status === 200 && !isSoft404) {
                console.log('Destination exists!')
                requestSuccess = true
                window.location.href = urlDest
            } else {
                console.log(msg)
                if(doAlert === true && requestSuccess === false) {
                    alert(msg)
                    location.reload();
                }
            }
        }
    }
    request.open('GET', urlDest, true);
    request.send()
}

function isPageNotFound(responseText) {
    let isSoft404 = false
    let template = new DOMParser().parseFromString(responseText, "text/html");
    let bannerTitle = ''

    if(template.getElementsByClassName('banner-title')[0] !== undefined) {
        bannerTitle = template.getElementsByClassName('banner-title')[0].innerText;
    }
    
    if (bannerTitle !== '') {
        isSoft404 = bannerTitle.includes('Ooops... Page Not Found')
    }
    return isSoft404
}

function getBaseURL(urlIdx) {
    let base = ''
    let currentPath = document.location.pathname
    let p = currentPath.split('/')
    for (let i = 1; i < urlIdx; i++) {
        base += '/' + p[i]
    }
    return base
}

function getCurrentPath(urlIdx, itemMap) {
    let currentPath = document.location.pathname
    let p = currentPath.split('/')
    let langLoc = p[urlIdx]
    if (itemMap[langLoc] != undefined) {
        currentPath = currentPath.replace('/' + langLoc, '')
    }

    return currentPath
}

function setTooltip() {
    $('[data-toggle="tooltip"]').tooltip;
}