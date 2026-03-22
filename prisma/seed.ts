import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/prisma";
import { encryptSecret } from "../src/modules/payments/payment-secrets";

async function main() {
  const now = new Date();
  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // 1️⃣ Country
  const nigeria = await prisma.country.upsert({
    where: { code: "NG" },
    update: {},
    create: {
      name: "Nigeria",
      code: "NG",
    },
  });

  // 2️⃣ Rental Provider
  const providerEmail = "provider@sureride.com";
  const provider = await prisma.rentalProvider.upsert({
    where: { email: providerEmail },
    update: {
      name: "SureRide Rentals",
      logoUrl: "https://example.com/logo.png",
      phone: "+2348012345678",
      password: defaultPasswordHash,
      isVerified: true,
      isActive: true,
    },
    create: {
      name: "SureRide Rentals",
      logoUrl: "https://example.com/logo.png",
      email: providerEmail,
      password: defaultPasswordHash,
      phone: "+2348012345678",
      isVerified: true,
      isActive: true,
    },
  });

  // 2️⃣b Admin
  const adminEmail = "admin@sureride.com";
  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      firstName: "Super",
      lastName: "Admin",
      password: defaultPasswordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      firstName: "Super",
      lastName: "Admin",
      email: adminEmail,
      password: defaultPasswordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  const allEmployeePermissions = [
    "EMPLOYEES_READ",
    "EMPLOYEES_CREATE",
    "EMPLOYEES_UPDATE",
    "EMPLOYEES_SUSPEND",
    "ROLES_READ",
    "ROLES_CREATE",
    "ROLES_UPDATE",
    "ROLES_DELETE",
    "PROVIDERS_MANAGE",
    "CARS_MANAGE",
    "BOOKINGS_MANAGE",
    "PROMOTIONS_MANAGE",
    "SETTINGS_MANAGE",
  ] as const;

  const superAdminEmployeeRole = await prisma.employeeRole.upsert({
    where: { name: "Super Admin" },
    update: {
      description: "Full platform control",
      permissions: [...allEmployeePermissions],
      isSystem: true,
    },
    create: {
      name: "Super Admin",
      description: "Full platform control",
      permissions: [...allEmployeePermissions],
      isSystem: true,
    },
  });

  await prisma.employeeRole.upsert({
    where: { name: "Operations Manager" },
    update: {
      description: "Operations role",
      permissions: ["EMPLOYEES_READ", "PROVIDERS_MANAGE", "CARS_MANAGE"],
      isSystem: false,
    },
    create: {
      name: "Operations Manager",
      description: "Operations role",
      permissions: ["EMPLOYEES_READ", "PROVIDERS_MANAGE", "CARS_MANAGE"],
      isSystem: false,
    },
  });

  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      roleId: superAdminEmployeeRole.id,
      nationality: "Nigeria",
      phoneCountry: "+234",
      phoneNumber: "8000000000",
    },
  });

  // 2️⃣c Payment Gateway (Option B)
  const stripePublishable = process.env.STRIPE_PUBLISHABLE_KEY || null;
  const stripeSecret = process.env.STRIPE_SECRET_KEY || null;
  const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET || null;
  const stripeReady = Boolean(stripePublishable && stripeSecret);

  const stripeGateway = await prisma.paymentGateway.upsert({
    where: { key: "stripe" },
    update: {
      displayName: "Stripe",
      runtimeAdapter: "STRIPE",
      mode: "TEST",
      isEnabled: stripeReady,
      isDefault: stripeReady,
      merchantDisplayName: process.env.STRIPE_MERCHANT_NAME || "SureRide",
      supportedCurrencies: ["ngn"],
      isArchived: false,
    },
    create: {
      key: "stripe",
      displayName: "Stripe",
      runtimeAdapter: "STRIPE",
      mode: "TEST",
      isEnabled: stripeReady,
      isDefault: stripeReady,
      merchantDisplayName: process.env.STRIPE_MERCHANT_NAME || "SureRide",
      supportedCurrencies: ["ngn"],
    },
  });

  if (stripeReady) {
    await prisma.paymentGateway.updateMany({
      where: {
        key: { not: "stripe" },
      },
      data: {
        isDefault: false,
      },
    });
  }

  const stripeFieldPublishable = await prisma.paymentGatewayField.upsert({
    where: {
      gatewayId_key: {
        gatewayId: stripeGateway.id,
        key: "publishable_key",
      },
    },
    update: {
      label: "Publishable Key",
      type: "TEXT",
      isRequired: true,
      isSecret: false,
      sortOrder: 1,
    },
    create: {
      gatewayId: stripeGateway.id,
      key: "publishable_key",
      label: "Publishable Key",
      type: "TEXT",
      isRequired: true,
      isSecret: false,
      sortOrder: 1,
    },
  });

  const stripeFieldSecret = await prisma.paymentGatewayField.upsert({
    where: {
      gatewayId_key: {
        gatewayId: stripeGateway.id,
        key: "secret_key",
      },
    },
    update: {
      label: "Secret Key",
      type: "SECRET",
      isRequired: true,
      isSecret: true,
      sortOrder: 2,
    },
    create: {
      gatewayId: stripeGateway.id,
      key: "secret_key",
      label: "Secret Key",
      type: "SECRET",
      isRequired: true,
      isSecret: true,
      sortOrder: 2,
    },
  });

  const stripeFieldWebhook = await prisma.paymentGatewayField.upsert({
    where: {
      gatewayId_key: {
        gatewayId: stripeGateway.id,
        key: "webhook_secret",
      },
    },
    update: {
      label: "Webhook Secret",
      type: "SECRET",
      isRequired: false,
      isSecret: true,
      sortOrder: 3,
    },
    create: {
      gatewayId: stripeGateway.id,
      key: "webhook_secret",
      label: "Webhook Secret",
      type: "SECRET",
      isRequired: false,
      isSecret: true,
      sortOrder: 3,
    },
  });

  if (stripePublishable) {
    await prisma.paymentGatewayFieldValue.upsert({
      where: {
        gatewayId_fieldId: {
          gatewayId: stripeGateway.id,
          fieldId: stripeFieldPublishable.id,
        },
      },
      update: {
        valuePlain: stripePublishable,
        valueEncrypted: null,
      },
      create: {
        gatewayId: stripeGateway.id,
        fieldId: stripeFieldPublishable.id,
        valuePlain: stripePublishable,
      },
    });
  }

  if (stripeSecret) {
    await prisma.paymentGatewayFieldValue.upsert({
      where: {
        gatewayId_fieldId: {
          gatewayId: stripeGateway.id,
          fieldId: stripeFieldSecret.id,
        },
      },
      update: {
        valuePlain: null,
        valueEncrypted: encryptSecret(stripeSecret),
      },
      create: {
        gatewayId: stripeGateway.id,
        fieldId: stripeFieldSecret.id,
        valueEncrypted: encryptSecret(stripeSecret),
      },
    });
  }

  if (stripeWebhook) {
    await prisma.paymentGatewayFieldValue.upsert({
      where: {
        gatewayId_fieldId: {
          gatewayId: stripeGateway.id,
          fieldId: stripeFieldWebhook.id,
        },
      },
      update: {
        valuePlain: null,
        valueEncrypted: encryptSecret(stripeWebhook),
      },
      create: {
        gatewayId: stripeGateway.id,
        fieldId: stripeFieldWebhook.id,
        valueEncrypted: encryptSecret(stripeWebhook),
      },
    });
  }

  // 2️⃣d Car metadata config
  const economyCategory = await prisma.carCategoryConfig.upsert({
    where: { slug: "economy" },
    update: {
      name: "Economy",
      source: "manual",
      sortOrder: 1,
      isActive: true,
    },
    create: {
      name: "Economy",
      slug: "economy",
      source: "manual",
      sortOrder: 1,
      isActive: true,
    },
  });

  const luxuryCategory = await prisma.carCategoryConfig.upsert({
    where: { slug: "luxury" },
    update: {
      name: "Luxury",
      source: "manual",
      sortOrder: 2,
      isActive: true,
    },
    create: {
      name: "Luxury",
      slug: "luxury",
      source: "manual",
      sortOrder: 2,
      isActive: true,
    },
  });

  const suvCategory = await prisma.carCategoryConfig.upsert({
    where: { slug: "suv" },
    update: {
      name: "SUV",
      externalId: "ext_cat_suv",
      source: "external-cars-api",
      sortOrder: 3,
      isActive: true,
    },
    create: {
      name: "SUV",
      slug: "suv",
      externalId: "ext_cat_suv",
      source: "external-cars-api",
      sortOrder: 3,
      isActive: true,
    },
  });

  const toyotaBrand = await prisma.carBrandConfig.upsert({
    where: {
      slug_categoryId: {
        slug: "toyota",
        categoryId: economyCategory.id,
      },
    },
    update: {
      name: "Toyota",
      source: "manual",
      sortOrder: 1,
      isActive: true,
    },
    create: {
      categoryId: economyCategory.id,
      name: "Toyota",
      slug: "toyota",
      source: "manual",
      sortOrder: 1,
      isActive: true,
    },
  });

  const hondaBrand = await prisma.carBrandConfig.upsert({
    where: {
      slug_categoryId: {
        slug: "honda",
        categoryId: luxuryCategory.id,
      },
    },
    update: {
      name: "Honda",
      source: "manual",
      sortOrder: 1,
      isActive: true,
    },
    create: {
      categoryId: luxuryCategory.id,
      name: "Honda",
      slug: "honda",
      source: "manual",
      sortOrder: 1,
      isActive: true,
    },
  });

  const lexusBrand = await prisma.carBrandConfig.upsert({
    where: {
      slug_categoryId: {
        slug: "lexus",
        categoryId: suvCategory.id,
      },
    },
    update: {
      name: "Lexus",
      externalId: "ext_brand_lexus",
      source: "external-cars-api",
      sortOrder: 2,
      isActive: true,
    },
    create: {
      categoryId: suvCategory.id,
      name: "Lexus",
      slug: "lexus",
      externalId: "ext_brand_lexus",
      source: "external-cars-api",
      sortOrder: 2,
      isActive: true,
    },
  });

  await prisma.carModelConfig.upsert({
    where: {
      slug_brandId: {
        slug: "corolla",
        brandId: toyotaBrand.id,
      },
    },
    update: {
      name: "Corolla",
      categoryId: economyCategory.id,
      source: "manual",
      sortOrder: 1,
      isActive: true,
    },
    create: {
      categoryId: economyCategory.id,
      brandId: toyotaBrand.id,
      name: "Corolla",
      slug: "corolla",
      source: "manual",
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.carModelConfig.upsert({
    where: {
      slug_brandId: {
        slug: "accord",
        brandId: hondaBrand.id,
      },
    },
    update: {
      name: "Accord",
      categoryId: luxuryCategory.id,
      source: "manual",
      sortOrder: 1,
      isActive: true,
    },
    create: {
      categoryId: luxuryCategory.id,
      brandId: hondaBrand.id,
      name: "Accord",
      slug: "accord",
      source: "manual",
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.carModelConfig.upsert({
    where: {
      slug_brandId: {
        slug: "rx-350",
        brandId: lexusBrand.id,
      },
    },
    update: {
      name: "RX 350",
      categoryId: suvCategory.id,
      externalId: "ext_model_rx350",
      source: "external-cars-api",
      sortOrder: 2,
      isActive: true,
    },
    create: {
      categoryId: suvCategory.id,
      brandId: lexusBrand.id,
      name: "RX 350",
      slug: "rx-350",
      externalId: "ext_model_rx350",
      source: "external-cars-api",
      sortOrder: 2,
      isActive: true,
    },
  });

  // 3️⃣ Locations
  const ikejaExisting = await prisma.location.findFirst({
    where: { name: "Ikeja City Mall", providerId: provider.id },
  });
  const ikeja =
    ikejaExisting ??
    (await prisma.location.create({
      data: {
        name: "Ikeja City Mall",
        address: "Ikeja, Lagos",
        countryId: nigeria.id,
        providerId: provider.id,
      },
    }));

  const lekkiExisting = await prisma.location.findFirst({
    where: { name: "Lekki Phase 1", providerId: provider.id },
  });
  const lekki =
    lekkiExisting ??
    (await prisma.location.create({
      data: {
        name: "Lekki Phase 1",
        address: "Lekki, Lagos",
        countryId: nigeria.id,
        providerId: provider.id,
      },
    }));

  // 4️⃣ Cars
  const car1Existing = await prisma.car.findFirst({
    where: {
      brand: "Toyota",
      model: "Corolla",
      providerId: provider.id,
      locationId: ikeja.id,
    },
  });
  const car1 = car1Existing
    ? await prisma.car.update({
        where: { id: car1Existing.id },
        data: {
          category: "ECONOMY",
          year: 2022,
          seats: 4,
          bags: "2",
          hasAC: true,
          transmission: "AUTOMATIC",
          mileagePolicy: "UNLIMITED",
          dailyRate: 25000,
          hourlyRate: 4000,
          isActive: true,
        },
      })
    : await prisma.car.create({
        data: {
          providerId: provider.id,
          locationId: ikeja.id,
          brand: "Toyota",
          model: "Corolla",
          category: "ECONOMY",
          year: 2022,
          seats: 4,
          bags: "2",
          hasAC: true,
          transmission: "AUTOMATIC",
          mileagePolicy: "UNLIMITED",
          dailyRate: 25000,
          hourlyRate: 4000,
        },
      });

  const car2Existing = await prisma.car.findFirst({
    where: {
      brand: "Honda",
      model: "Accord",
      providerId: provider.id,
      locationId: lekki.id,
    },
  });
  const car2 = car2Existing
    ? await prisma.car.update({
        where: { id: car2Existing.id },
        data: {
          category: "LUXURY",
          year: 2023,
          seats: 5,
          bags: "3",
          hasAC: true,
          transmission: "AUTOMATIC",
          mileagePolicy: "UNLIMITED",
          dailyRate: 35000,
          hourlyRate: 6000,
          isActive: true,
        },
      })
    : await prisma.car.create({
        data: {
          providerId: provider.id,
          locationId: lekki.id,
          brand: "Honda",
          model: "Accord",
          category: "LUXURY",
          year: 2023,
          seats: 5,
          bags: "3",
          hasAC: true,
          transmission: "AUTOMATIC",
          mileagePolicy: "UNLIMITED",
          dailyRate: 35000,
          hourlyRate: 6000,
        },
      });

  // 5️⃣ Car Images (primary + gallery)
  const car1ImageUrls = [
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80",
  ];
  const car2ImageUrls = [
    "https://images.unsplash.com/photo-1486326658981-ed68abe5868e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1537041373299-198a2f5a8f88?auto=format&fit=crop&w=1200&q=80",
  ];

  const existingCar1 = await prisma.carImage.findMany({
    where: { carId: car1.id, url: { in: car1ImageUrls } },
    select: { url: true },
  });
  const existingCar1Urls = new Set(existingCar1.map((i) => i.url));
  for (const [index, url] of car1ImageUrls.entries()) {
    if (!existingCar1Urls.has(url)) {
      await prisma.carImage.create({
        data: {
          carId: car1.id,
          url,
          isPrimary: index === 0,
        },
      });
    }
  }

  const existingCar2 = await prisma.carImage.findMany({
    where: { carId: car2.id, url: { in: car2ImageUrls } },
    select: { url: true },
  });
  const existingCar2Urls = new Set(existingCar2.map((i) => i.url));
  for (const [index, url] of car2ImageUrls.entries()) {
    if (!existingCar2Urls.has(url)) {
      await prisma.carImage.create({
        data: {
          carId: car2.id,
          url,
          isPrimary: index === 0,
        },
      });
    }
  }

  // 6️⃣ Users
  const passwordHash = defaultPasswordHash;
  const verifiedUser = await prisma.user.upsert({
    where: { email: "verified@sureride.com" },
    update: {
      firstName: "Verified",
      lastName: "User",
      phoneCountry: "+234",
      phoneNumber: "8100000001",
      dateOfBirth: new Date("1995-01-01"),
      nationality: "Nigeria",
      password: passwordHash,
      isVerified: true,
      profileStatus: "VERIFIED",
    },
    create: {
      firstName: "Verified",
      lastName: "User",
      email: "verified@sureride.com",
      phoneCountry: "+234",
      phoneNumber: "8100000001",
      dateOfBirth: new Date("1995-01-01"),
      nationality: "Nigeria",
      password: passwordHash,
      authProvider: "EMAIL",
      isVerified: true,
      profileStatus: "VERIFIED",
    },
  });

  const unverifiedUser = await prisma.user.upsert({
    where: { email: "unverified@sureride.com" },
    update: {
      firstName: "Unverified",
      lastName: "User",
      phoneCountry: "+234",
      phoneNumber: "8100000002",
      dateOfBirth: new Date("1998-03-10"),
      nationality: "Nigeria",
      password: passwordHash,
      isVerified: false,
      profileStatus: "INCOMPLETE",
    },
    create: {
      firstName: "Unverified",
      lastName: "User",
      email: "unverified@sureride.com",
      phoneCountry: "+234",
      phoneNumber: "8100000002",
      dateOfBirth: new Date("1998-03-10"),
      nationality: "Nigeria",
      password: passwordHash,
      authProvider: "EMAIL",
      isVerified: false,
      profileStatus: "INCOMPLETE",
    },
  });

  // 7️⃣ KYC for verified user
  await prisma.userKyc.upsert({
    where: { userId: verifiedUser.id },
    update: {
      state: "Lagos",
      region: "Ikeja",
      homeAddress: "12 Example Street",
      governmentIdType: "NIN",
      governmentIdNumber: "A1234567890",
      driverLicenseNumber: "DL-12345",
      driverLicenseExpiry: new Date("2030-01-01"),
      passportPhotoUrl: "https://example.com/kyc/passport.jpg",
      governmentIdFrontUrl: "https://example.com/kyc/gov-front.jpg",
      governmentIdBackUrl: "https://example.com/kyc/gov-back.jpg",
      driverLicenseFrontUrl: "https://example.com/kyc/dl-front.jpg",
      driverLicenseBackUrl: "https://example.com/kyc/dl-back.jpg",
      status: "VERIFIED",
    },
    create: {
      userId: verifiedUser.id,
      state: "Lagos",
      region: "Ikeja",
      homeAddress: "12 Example Street",
      governmentIdType: "NIN",
      governmentIdNumber: "A1234567890",
      driverLicenseNumber: "DL-12345",
      driverLicenseExpiry: new Date("2030-01-01"),
      passportPhotoUrl: "https://example.com/kyc/passport.jpg",
      governmentIdFrontUrl: "https://example.com/kyc/gov-front.jpg",
      governmentIdBackUrl: "https://example.com/kyc/gov-back.jpg",
      driverLicenseFrontUrl: "https://example.com/kyc/dl-front.jpg",
      driverLicenseBackUrl: "https://example.com/kyc/dl-back.jpg",
      status: "VERIFIED",
    },
  });

  // 8️⃣ OTPs
  await prisma.otp.deleteMany({
    where: { userId: unverifiedUser.id, purpose: "VERIFY_ACCOUNT" },
  });
  await prisma.otp.create({
    data: {
      userId: unverifiedUser.id,
      code: "1234",
      purpose: "VERIFY_ACCOUNT",
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
      lastSentAt: now,
    },
  });

  await prisma.otp.deleteMany({
    where: { userId: verifiedUser.id, purpose: "RESET_PASSWORD" },
  });
  await prisma.otp.create({
    data: {
      userId: verifiedUser.id,
      code: "9999",
      purpose: "RESET_PASSWORD",
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
      lastSentAt: now,
    },
  });

  // 9️⃣ Insurance Packages
  const adminInsurance =
    (await prisma.insurancePackage.findFirst({
      where: { name: "Standard Cover", providerId: null, carId: null },
    })) ??
    (await prisma.insurancePackage.create({
      data: {
        name: "Standard Cover",
        description: "Global admin insurance",
        dailyPrice: 2000,
        providerId: null,
      },
    }));

  const providerInsurance =
    (await prisma.insurancePackage.findFirst({
      where: { name: "Provider Cover", providerId: provider.id, carId: null },
    })) ??
    (await prisma.insurancePackage.create({
      data: {
        name: "Provider Cover",
        description: "Provider-specific insurance",
        dailyPrice: 2500,
        providerId: provider.id,
      },
    }));

  if (!(await prisma.insurancePackage.findFirst({
    where: { name: "Car Premium", carId: car2.id },
  }))) {
    await prisma.insurancePackage.create({
      data: {
        name: "Car Premium",
        description: "Car-specific premium cover",
        dailyPrice: 3000,
        carId: car2.id,
        providerId: provider.id,
      },
    });
  }

  // 10️⃣ Features
  const globalGps =
    (await prisma.feature.findFirst({
      where: { name: "GPS", providerId: null },
    })) ??
    (await prisma.feature.create({
      data: {
        name: "GPS",
        category: "COMFORT",
        icon: "gps",
        providerId: null,
      },
    }));

  const globalBluetooth =
    (await prisma.feature.findFirst({
      where: { name: "Bluetooth Audio", providerId: null },
    })) ??
    (await prisma.feature.create({
      data: {
        name: "Bluetooth Audio",
        category: "COMFORT",
        icon: "bluetooth",
        providerId: null,
      },
    }));

  const providerChildSeat =
    (await prisma.feature.findFirst({
      where: { name: "Child Seat", providerId: provider.id },
    })) ??
    (await prisma.feature.create({
      data: {
        name: "Child Seat",
        category: "SAFETY",
        icon: "child-seat",
        providerId: provider.id,
      },
    }));

  const providerExtraLuggage =
    (await prisma.feature.findFirst({
      where: { name: "Extra Luggage", providerId: provider.id },
    })) ??
    (await prisma.feature.create({
      data: {
        name: "Extra Luggage",
        category: "RENTAL_POLICY",
        icon: "luggage",
        providerId: provider.id,
      },
    }));

  await prisma.carFeature.createMany({
    data: [
      { carId: car1.id, featureId: globalGps.id },
      { carId: car1.id, featureId: providerChildSeat.id },
      { carId: car2.id, featureId: globalGps.id },
      { carId: car2.id, featureId: globalBluetooth.id },
      { carId: car2.id, featureId: providerExtraLuggage.id },
    ],
    skipDuplicates: true,
  });

  // 11️⃣ Booking (matches sample dates)
  const bookingStart = new Date("2026-02-06T10:00:00Z");
  const bookingEnd = new Date("2026-02-07T10:00:00Z");
  const existingBooking = await prisma.booking.findFirst({
    where: {
      userId: verifiedUser.id,
      carId: car2.id,
      pickupAt: bookingStart,
      returnAt: bookingEnd,
    },
  });

  const booking = existingBooking
    ? existingBooking
    : await (async () => {
    const days = Math.ceil(
      (bookingEnd.getTime() - bookingStart.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const basePrice = days * car2.dailyRate;
    const insuranceFee = days * adminInsurance.dailyPrice;
    const totalPrice = basePrice + insuranceFee;

    return prisma.booking.create({
      data: {
        userId: verifiedUser.id,
        carId: car2.id,
        pickupAt: bookingStart,
        returnAt: bookingEnd,
        pickupLocationId: lekki.id,
        dropoffLocationId: ikeja.id,
        pricingUnit: "DAILY",
        basePrice,
        insuranceFee,
        totalPrice,
        insuranceId: adminInsurance.id,
        status: "PENDING",
      },
    });
  })();

  console.log("✅ Seed complete");
  console.log("Admin:", admin.email, "Password123!", "role", admin.role);
  console.log("Verified user:", verifiedUser.email, "Password123!");
  console.log("Unverified user:", unverifiedUser.email, "Password123!", "OTP 1234");
  console.log("Provider insurance id:", providerInsurance.id);
  console.log("Admin insurance id:", adminInsurance.id);
  console.log("Global feature GPS id:", globalGps.id);
  console.log("Provider feature Child Seat id:", providerChildSeat.id);
  console.log("Ikeja location id:", ikeja.id);
  console.log("Lekki location id:", lekki.id);
  console.log("Car 1 (Corolla) id:", car1.id);
  console.log("Car 2 (Accord) id:", car2.id);
  console.log("Booking id:", booking.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
