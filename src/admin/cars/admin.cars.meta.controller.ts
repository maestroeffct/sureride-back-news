import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  createBrandConfigSchema,
  createCategoryConfigSchema,
  createModelConfigSchema,
  importBrandsSchema,
  importCategoriesSchema,
  importModelsSchema,
  metaBrandListQuerySchema,
  metaCategoryListQuerySchema,
  metaModelListQuerySchema,
  updateBrandConfigSchema,
  updateCategoryConfigSchema,
  updateModelConfigSchema,
} from "./admin.cars.meta.validation";
import {
  createCarMetaBrand,
  createCarMetaCategory,
  createCarMetaModel,
  importCarMetaBrands,
  importCarMetaCategories,
  importCarMetaModels,
  listCarMetaBrands,
  listCarMetaCategories,
  listCarMetaModels,
  updateCarMetaBrand,
  updateCarMetaCategory,
  updateCarMetaModel,
} from "./admin.cars.meta.service";

function zodFail(res: Response, err: ZodError) {
  return res.status(400).json({
    message: "Validation failed",
    errors: err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    })),
  });
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function mapMetaError(res: Response, err: any) {
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

export async function adminListCarMetaCategoriesController(
  req: Request,
  res: Response,
) {
  try {
    const query = metaCategoryListQuerySchema.parse(req.query);
    const data = await listCarMetaCategories(query);
    return res.json(data);
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    return mapMetaError(res, err);
  }
}

export async function adminImportCarMetaCategoriesController(
  req: Request,
  res: Response,
) {
  try {
    const body = importCategoriesSchema.parse(req.body);
    const result = await importCarMetaCategories(body);
    return res.json(result);
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    return mapMetaError(res, err);
  }
}

export async function adminCreateCarMetaCategoryController(
  req: Request,
  res: Response,
) {
  try {
    const body = createCategoryConfigSchema.parse(req.body);
    const category = await createCarMetaCategory(body);
    return res.status(201).json(category);
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    return mapMetaError(res, err);
  }
}

export async function adminUpdateCarMetaCategoryController(
  req: Request,
  res: Response,
) {
  try {
    const body = updateCategoryConfigSchema.parse(req.body);
    const categoryId = getSingleParam(req.params.categoryId);
    if (!categoryId) {
      return res.status(400).json({ message: "Category id is required" });
    }
    const category = await updateCarMetaCategory(categoryId, body);
    return res.json(category);
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    return mapMetaError(res, err);
  }
}

export async function adminListCarMetaBrandsController(
  req: Request,
  res: Response,
) {
  try {
    const query = metaBrandListQuerySchema.parse(req.query);
    const data = await listCarMetaBrands(query);
    return res.json(data);
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    return mapMetaError(res, err);
  }
}

export async function adminImportCarMetaBrandsController(
  req: Request,
  res: Response,
) {
  try {
    const body = importBrandsSchema.parse(req.body);
    const result = await importCarMetaBrands(body);
    return res.json(result);
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    return mapMetaError(res, err);
  }
}

export async function adminCreateCarMetaBrandController(
  req: Request,
  res: Response,
) {
  try {
    const body = createBrandConfigSchema.parse(req.body);
    const brand = await createCarMetaBrand(body);
    return res.status(201).json(brand);
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    return mapMetaError(res, err);
  }
}

export async function adminUpdateCarMetaBrandController(
  req: Request,
  res: Response,
) {
  try {
    const body = updateBrandConfigSchema.parse(req.body);
    const brandId = getSingleParam(req.params.brandId);
    if (!brandId) {
      return res.status(400).json({ message: "Brand id is required" });
    }
    const brand = await updateCarMetaBrand(brandId, body);
    return res.json(brand);
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    return mapMetaError(res, err);
  }
}

export async function adminListCarMetaModelsController(
  req: Request,
  res: Response,
) {
  try {
    const query = metaModelListQuerySchema.parse(req.query);
    const data = await listCarMetaModels(query);
    return res.json(data);
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    return mapMetaError(res, err);
  }
}

export async function adminImportCarMetaModelsController(
  req: Request,
  res: Response,
) {
  try {
    const body = importModelsSchema.parse(req.body);
    const result = await importCarMetaModels(body);
    return res.json(result);
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    return mapMetaError(res, err);
  }
}

export async function adminCreateCarMetaModelController(
  req: Request,
  res: Response,
) {
  try {
    const body = createModelConfigSchema.parse(req.body);
    const model = await createCarMetaModel(body);
    return res.status(201).json(model);
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    return mapMetaError(res, err);
  }
}

export async function adminUpdateCarMetaModelController(
  req: Request,
  res: Response,
) {
  try {
    const body = updateModelConfigSchema.parse(req.body);
    const modelId = getSingleParam(req.params.modelId);
    if (!modelId) {
      return res.status(400).json({ message: "Model id is required" });
    }
    const model = await updateCarMetaModel(modelId, body);
    return res.json(model);
  } catch (err: any) {
    if (err instanceof ZodError) return zodFail(res, err);
    return mapMetaError(res, err);
  }
}
