import { UAParser } from 'ua-parser-js';

interface UserInfo {
    Browser: string,
    OS: string,
    Device: string,
}

export function getUserDeviceInfo () {
    const { browser, os, device } = UAParser(window.navigator.userAgent)

    const userInfo: UserInfo  = {
        Browser: `${browser.name} ${browser.major}`,
        OS: `${os.name} ${os.version}`,
        Device: device.model == undefined ? "undefined" : `${device.vendor} ${device.model}`
    }
    
    return userInfo
}