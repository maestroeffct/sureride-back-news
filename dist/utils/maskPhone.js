"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskPhone = maskPhone;
function maskPhone(phoneNumber) {
    if (phoneNumber.length < 4)
        return phoneNumber;
    const first = phoneNumber.slice(0, 3);
    const last = phoneNumber.slice(-2);
    return `${first}*****${last}`;
}
