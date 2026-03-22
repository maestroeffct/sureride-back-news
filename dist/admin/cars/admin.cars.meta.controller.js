"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListCarMetaCategoriesController = adminListCarMetaCategoriesController;
exports.adminImportCarMetaCategoriesController = adminImportCarMetaCategoriesController;
exports.adminCreateCarMetaCategoryController = adminCreateCarMetaCategoryController;
exports.adminUpdateCarMetaCategoryController = adminUpdateCarMetaCategoryController;
exports.adminListCarMetaBrandsController = adminListCarMetaBrandsController;
exports.adminImportCarMetaBrandsController = adminImportCarMetaBrandsController;
exports.adminCreateCarMetaBrandController = adminCreateCarMetaBrandController;
exports.adminUpdateCarMetaBrandController = adminUpdateCarMetaBrandController;
exports.adminListCarMetaModelsController = adminListCarMetaModelsController;
exports.adminImportCarMetaModelsController = adminImportCarMetaModelsController;
exports.adminCreateCarMetaModelController = adminCreateCarMetaModelController;
exports.adminUpdateCarMetaModelController = adminUpdateCarMetaModelController;
const zod_1 = require("zod");
const admin_cars_meta_validation_1 = require("./admin.cars.meta.validation");
const admin_cars_meta_service_1 = require("./admin.cars.meta.service");
function zodFail(res, err) {
    return res.status(400).json({
        message: "Validation failed",
        errors: err.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
        })),
    });
}
function getSingleParam(value) {
    return Array.isArray(value) ? value[0] : value;
}
function mapMetaError(res, err) {
    if (err.message === "CATEGORY_NOT_FOUND") {
        return res.status(404).json({ message: "Category not found" });
    }
    if (err.message === "BRAND_NOT_FOUND") {
        return res.status(404).json({ message: "Brand not found" });
    }
    if (err.message === "MODEL_NOT_FOUND") {
        return res.status(404).json({ message: "Model not found" });
    }
    if (err.message === "BRAND_CATEGORY_MISMATCH") {
        return res.status(400).json({ message: "Brand does not belong to category" });
    }
    if (err.code === "P2002") {
        return res.status(409).json({ message: "Duplicate metadata entry" });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
}
async function adminListCarMetaCategoriesController(req, res) {
    try {
        const query = admin_cars_meta_validation_1.metaCategoryListQuerySchema.parse(req.query);
        const data = await (0, admin_cars_meta_service_1.listCarMetaCategories)(query);
        return res.json(data);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        return mapMetaError(res, err);
    }
}
async function adminImportCarMetaCategoriesController(req, res) {
    try {
        const body = admin_cars_meta_validation_1.importCategoriesSchema.parse(req.body);
        const result = await (0, admin_cars_meta_service_1.importCarMetaCategories)(body);
        return res.json(result);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        return mapMetaError(res, err);
    }
}
async function adminCreateCarMetaCategoryController(req, res) {
    try {
        const body = admin_cars_meta_validation_1.createCategoryConfigSchema.parse(req.body);
        const category = await (0, admin_cars_meta_service_1.createCarMetaCategory)(body);
        return res.status(201).json(category);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        return mapMetaError(res, err);
    }
}
async function adminUpdateCarMetaCategoryController(req, res) {
    try {
        const body = admin_cars_meta_validation_1.updateCategoryConfigSchema.parse(req.body);
        const categoryId = getSingleParam(req.params.categoryId);
        if (!categoryId) {
            return res.status(400).json({ message: "Category id is required" });
        }
        const category = await (0, admin_cars_meta_service_1.updateCarMetaCategory)(categoryId, body);
        return res.json(category);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        return mapMetaError(res, err);
    }
}
async function adminListCarMetaBrandsController(req, res) {
    try {
        const query = admin_cars_meta_validation_1.metaBrandListQuerySchema.parse(req.query);
        const data = await (0, admin_cars_meta_service_1.listCarMetaBrands)(query);
        return res.json(data);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        return mapMetaError(res, err);
    }
}
async function adminImportCarMetaBrandsController(req, res) {
    try {
        const body = admin_cars_meta_validation_1.importBrandsSchema.parse(req.body);
        const result = await (0, admin_cars_meta_service_1.importCarMetaBrands)(body);
        return res.json(result);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        return mapMetaError(res, err);
    }
}
async function adminCreateCarMetaBrandController(req, res) {
    try {
        const body = admin_cars_meta_validation_1.createBrandConfigSchema.parse(req.body);
        const brand = await (0, admin_cars_meta_service_1.createCarMetaBrand)(body);
        return res.status(201).json(brand);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        return mapMetaError(res, err);
    }
}
async function adminUpdateCarMetaBrandController(req, res) {
    try {
        const body = admin_cars_meta_validation_1.updateBrandConfigSchema.parse(req.body);
        const brandId = getSingleParam(req.params.brandId);
        if (!brandId) {
            return res.status(400).json({ message: "Brand id is required" });
        }
        const brand = await (0, admin_cars_meta_service_1.updateCarMetaBrand)(brandId, body);
        return res.json(brand);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        return mapMetaError(res, err);
    }
}
async function adminListCarMetaModelsController(req, res) {
    try {
        const query = admin_cars_meta_validation_1.metaModelListQuerySchema.parse(req.query);
        const data = await (0, admin_cars_meta_service_1.listCarMetaModels)(query);
        return res.json(data);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        return mapMetaError(res, err);
    }
}
async function adminImportCarMetaModelsController(req, res) {
    try {
        const body = admin_cars_meta_validation_1.importModelsSchema.parse(req.body);
        const result = await (0, admin_cars_meta_service_1.importCarMetaModels)(body);
        return res.json(result);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        return mapMetaError(res, err);
    }
}
async function adminCreateCarMetaModelController(req, res) {
    try {
        const body = admin_cars_meta_validation_1.createModelConfigSchema.parse(req.body);
        const model = await (0, admin_cars_meta_service_1.createCarMetaModel)(body);
        return res.status(201).json(model);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        return mapMetaError(res, err);
    }
}
async function adminUpdateCarMetaModelController(req, res) {
    try {
        const body = admin_cars_meta_validation_1.updateModelConfigSchema.parse(req.body);
        const modelId = getSingleParam(req.params.modelId);
        if (!modelId) {
            return res.status(400).json({ message: "Model id is required" });
        }
        const model = await (0, admin_cars_meta_service_1.updateCarMetaModel)(modelId, body);
        return res.json(model);
    }
    catch (err) {
        if (err instanceof zod_1.ZodError)
            return zodFail(res, err);
        return mapMetaError(res, err);
    }
}
