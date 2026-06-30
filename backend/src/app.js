import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { userRoutes } from "./routes/users.js";
import { authRoutes } from "./routes/auth.js";
import { profileRoutes } from "./routes/profile.js";
import { appointmentRoutes } from "./routes/appointments.js";
import {servicesRoutes} from "./routes/services.js";
import { patientRoutes } from "./routes/patients.js";
import { reportsRoutes } from "./routes/reports.js";
import { expensesRoutes } from "./routes/expenses.js";
import { dailyReportsRoutes } from "./routes/dailyReports.js";
import { leaveRequestRoutes } from "./routes/leaveRequest.js";
import { fileRoutes } from "./routes/files.js";

export const app = new Elysia({
  prefix: "/api"
})

.use(
  cors({
    origin: true,
    credentials: true,
  })
)

/* IMPORTANT */
.onError(({ code, error }) => {

  console.log(
    "SERVER ERROR:",
    code,
    error
  );
})

.get("/health", () => ({
  success: true,
  message: "DentConnect API running",
}))

.use(userRoutes)
.use(authRoutes)
.use(profileRoutes)
.use(appointmentRoutes)
.use(servicesRoutes)
.use(patientRoutes)
.use(reportsRoutes)
.use(expensesRoutes)
.use(dailyReportsRoutes)
.use(fileRoutes)
.use(leaveRequestRoutes);

