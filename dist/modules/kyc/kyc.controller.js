"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePersonalInfo = savePersonalInfo;
exports.saveAddressInfo = saveAddressInfo;
exports.uploadDocuments = uploadDocuments;
const prisma_1 = require("../../prisma");
/**
 * STEP 1 – Save Personal Info
 */
async function savePersonalInfo(req, res) {
    try {
        const userId = req.user?.userId;
        const { firstName, lastName, email, dateOfBirth, nationality, phoneCountry, phoneNumber, } = req.body;
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                email,
                dateOfBirth: new Date(dateOfBirth),
                nationality,
                phoneCountry,
                phoneNumber,
            },
        });
        return res.json({ message: "Personal info saved" });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to save personal info" });
    }
}
/**
 * STEP 2 – Save Address Info
 */
async function saveAddressInfo(req, res) {
    try {
        const userId = req.user?.userId;
        const { state, region, homeAddress } = req.body;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        await prisma_1.prisma.userKyc.upsert({
            where: { userId },
            update: {
                state,
                region,
                homeAddress,
            },
            create: {
                user: { connect: { id: userId } },
                state,
                region,
                homeAddress,
                governmentIdType: "",
                governmentIdNumber: "",
                driverLicenseNumber: "",
                driverLicenseExpiry: new Date(),
                passportPhotoUrl: "",
                governmentIdFrontUrl: "",
                governmentIdBackUrl: "",
                driverLicenseFrontUrl: "",
                driverLicenseBackUrl: "",
            },
        });
        return res.json({ message: "Address saved" });
    }
    catch (err) {
        return res.status(500).json({ message: "Failed to save address" });
    }
}
/**
 * STEP 3 – Upload Documents
 */
async function uploadDocuments(req, res) {
    try {
        const userId = req.user?.userId;
        const files = req.files;
        if (!files) {
            return res.status(400).json({ message: "No files uploaded" });
        }
        const passport = files.passport?.[0]?.filename;
        const govFront = files.govFront?.[0]?.filename;
        const govBack = files.govBack?.[0]?.filename;
        const licenseFront = files.licenseFront?.[0]?.filename;
        const licenseBack = files.licenseBack?.[0]?.filename;
        const { governmentIdType, governmentIdNumber, driverLicenseNumber, driverLicenseExpiry, } = req.body;
        const parsedDriverLicenseExpiry = driverLicenseExpiry && !Number.isNaN(Date.parse(driverLicenseExpiry))
            ? new Date(driverLicenseExpiry)
            : undefined;
        await prisma_1.prisma.userKyc.update({
            where: { userId },
            data: {
                passportPhotoUrl: passport,
                governmentIdFrontUrl: govFront,
                governmentIdBackUrl: govBack,
                driverLicenseFrontUrl: licenseFront,
                driverLicenseBackUrl: licenseBack,
                ...(governmentIdType && { governmentIdType }),
                ...(governmentIdNumber && { governmentIdNumber }),
                ...(driverLicenseNumber && { driverLicenseNumber }),
                ...(parsedDriverLicenseExpiry && { driverLicenseExpiry: parsedDriverLicenseExpiry }),
                status: "PENDING_VERIFICATION",
            },
        });
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { profileStatus: "PENDING_VERIFICATION" },
        });
        return res.json({
            message: "Documents uploaded",
            profileStatus: "PENDING_VERIFICATION",
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Upload failed" });
    }
}
