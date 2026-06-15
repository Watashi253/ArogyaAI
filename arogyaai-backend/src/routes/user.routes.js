import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { prisma } from "../config/db.js";

const router = express.Router();

/*
GET CURRENT USER PROFILE
*/

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
      include: {
        profile: true,
      },
    });

    const { passwordHash, ...safeUser } = user

    res.status(200).json(safeUser)
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

/*
CREATE OR UPDATE PROFILE
*/

router.put("/profile", authenticate, async (req, res) => {
  try {
    const {
      heightCm,
      weightKg,
      age,
      gender,
      conditions,
      allergies,
      targetCalories,
      targetProteinG,
      targetSleepHrs,
      targetWaterMl,
      activityLevel,
    } = req.body;

    // Normalize enums and defaults for Prisma
    const genderMap = { male: 'MALE', female: 'FEMALE', other: 'OTHER' }
    const genderVal = gender ? (genderMap[gender.toString().toLowerCase()] || gender.toString().toUpperCase()) : null
    const activityVal = activityLevel
      ? activityLevel.toString().toUpperCase().replace(/[^A-Z0-9]/g, '_')
      : null
    const conditionsVal = Array.isArray(conditions) ? conditions : conditions ? [conditions] : []
    const allergiesVal = Array.isArray(allergies) ? allergies : allergies ? [allergies] : []

    const profile = await prisma.userProfile.upsert({
      where: {
        userId: req.userId,
      },

      update: {
        heightCm,
        weightKg,
        age,
        gender: genderVal,
        conditions: conditionsVal,
        allergies: allergiesVal,
        targetCalories,
        targetProteinG,
        targetSleepHrs,
        targetWaterMl,
        activityLevel: activityVal,
      },

      create: {
        userId: req.userId,
        heightCm,
        weightKg,
        age,
        gender: genderVal,
        conditions: conditionsVal,
        allergies: allergiesVal,
        targetCalories,
        targetProteinG,
        targetSleepHrs,
        targetWaterMl,
        activityLevel: activityVal,
      },
    });

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;