import { z } from "zod";

export const step1Schema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  oneLiner: z.string().min(10, "Please write at least 10 characters").max(200),
  sector: z.string().min(1, "Sector is required"),
  stage: z.enum(["pre-seed", "seed", "series-a", "series-b+"], "Stage is required"),
});

export const step2Schema = z.object({
  problem: z.string().min(20, "Please describe the problem (min 20 chars)"),
  solution: z.string().min(20, "Please describe your solution (min 20 chars)"),
  marketSize: z.string().min(5, "Market size is required"),
});

export const teamMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
});

export const step4Schema = z.object({
  teamMembers: z
    .array(teamMemberSchema)
    .min(1, "Add at least one team member")
    .max(6, "Maximum 6 team members"),
});

export const step3Schema = z.object({
  keyMetrics: z.string().min(5, "Key metrics are required"),
  growthRate: z.string().min(1, "Growth rate is required"),
  notableCustomers: z.string(),
});

export const step5Schema = z.object({
  currentRevenue: z.string().min(1, "Current revenue / ARR is required"),
  burnRate: z.string().min(1, "Burn rate is required"),
  runway: z.string().min(1, "Runway is required"),
  threeYearProjections: z.string().min(10, "Please describe your projections"),
});

export const step6Schema = z.object({
  raiseAmount: z.string().min(1, "Raise amount is required"),
  valuationExpectation: z.string().min(1, "Valuation expectation is required"),
  useOfFunds: z.string().min(20, "Please describe how you'll use the funds"),
  currentInvestors: z.string(),
});

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;
export type Step6Data = z.infer<typeof step6Schema>;

export type AllStepData = Step1Data &
  Step2Data &
  Step3Data &
  Step4Data &
  Step5Data &
  Step6Data;
