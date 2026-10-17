# AttendX

AttendX is an attendance management system that uses AI face recognition to identify enrolled students from classroom photos. Students enroll into course rosters using a static per-subject QR code or unique join code, while instructors review, manually override, and finalize attendance records before saving. The platform provides dedicated teacher and student portals alongside attendance analytics and CSV report exports.

## Prerequisites

- **Node.js**: v18+ or v20+ with `npm`
- **Python**: Python 3.14 (64-bit) used (or Python 3.10+)
- **Supabase**: Hosted PostgreSQL database instance with the project schema applied

---

## Setup from a Fresh Clone (Windows)

Follow these steps after cloning the repository:

### 1. Set Up the Face-Service Python Virtual Environment

Create the virtual environment inside `backend/face-service/venv` using Python (tested with **Python 3.14.3** 64-bit) and install the backend requirements:

```powershell
# Navigate to the face-service directory
cd backend\face-service

# Create virtual environment named "venv"
py -3.14 -m venv venv
# (or if using default Python 3.14 / 3.10+: python -m venv venv)

# Upgrade pip and install all required packages using the venv interpreter explicitly
& "venv\Scripts\python.exe" -m pip install --upgrade pip
& "venv\Scripts\python.exe" -m pip install -r requirements.txt

# Return to root directory
cd ..\..
```

### 2. Configure the Supabase Database Schema

1. Open your project dashboard at [Supabase](https://supabase.com).
2. Go to the **SQL Editor** tab.
3. Open `backend/supabase/schema.sql` from this repository, copy its entire contents, paste them into the SQL Editor, and click **Run**.
4. This creates all necessary tables (`teachers`, `students`, `subjects`, `subject_students`, `attendance_logs`) and database indexes.

### 3. Configure Frontend Environment Variables

Copy the template environment file to `.env.local`:

```powershell
cd frontend
copy .env.example .env.local
```

Open `frontend/.env.local` and enter your Supabase project credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-secret-key>
```

> [!NOTE]
> The database is hosted remotely on Supabase, so restarting your local machine never loses data. Only the two local servers (face-service backend and Next.js frontend) need to be restarted.

### 4. Install Frontend Dependencies

From the `frontend` directory, install all Node packages:

```powershell
npm install
cd ..
```

---

## Startup Order & Commands

Always start the services in the following order:

### 1. Start the Face Service (AI Backend)

Run the face-service using the virtual environment interpreter explicitly. **Never use the global `python` command**, as dependencies like `dlib-bin` are installed specifically inside the venv:

```powershell
# From the project root
& "backend\face-service\venv\Scripts\python.exe" run.py
```

*(Or from `backend/face-service`: `& "venv\Scripts\python.exe" run.py`)*

### 2. Verify Face Service Health Check

Before starting the frontend, verify that the face service is running with dlib support by visiting or calling:

```http
GET http://localhost:8000/health
```

The response **must** include:
```json
{
  "status": "ok",
  "dlib_available": true
}
```

> [!WARNING]
> If `"dlib_available"` is `false`, the wrong Python interpreter was used. Stop the server, ensure you are running `backend\face-service\venv\Scripts\python.exe`, and re-check before proceeding.

### 3. Start the Next.js Frontend

Once the face service health check passes, start the frontend development server:

```bash
cd frontend
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

---

## Known Limitations

- **Static QR for Enrollment Only**: The subject QR code is static and used strictly for student course roster enrollment (joining a subject). It does not rotate and is not used for logging attendance sessions.
- **No Liveness Detection**: The face recognition pipeline does not perform active liveness checks or anti-spoofing verification.
- **Matching Distance Threshold**: Face embedding comparisons use a Euclidean distance threshold of `0.6` against registered 128-dimensional facial vectors.
