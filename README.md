# AttendX

AttendX is an attendance management system that uses AI face recognition to identify enrolled students from classroom photos. Students enroll into course rosters using a static per-subject QR code or unique join code, while instructors review, manually override, and finalize attendance records before saving. The platform provides dedicated teacher and student portals alongside attendance analytics and CSV report exports.

## Prerequisites

- **Node.js**: v18+ or v20+ with `npm`
- **Python**: 3.10+ with CMake/C++ build tools installed for `dlib`
- **Python Virtual Environment**: Located at `backend/face-service/venv` with all dependencies from `requirements.txt` installed
- **Supabase**: Hosted PostgreSQL database instance with the project schema applied

### Environment Variables

Configure `frontend/.env.local` with the following variable names (do not commit this file):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

> [!NOTE]
> The database is hosted remotely on Supabase, so restarting your local machine never loses data. Only the two local servers (face-service backend and Next.js frontend) need to be restarted.

## Startup Order & Commands

Always start the services in the following order:

### 1. Start the Face Service (AI Backend)

Run the face-service using the virtual environment interpreter explicitly. **Never use the global `python` command**, as `dlib` is installed specifically inside the venv:

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
  "status": "healthy",
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

## Known Limitations

- **Static QR for Enrollment Only**: The subject QR code is static and used strictly for student course roster enrollment (joining a subject). It does not rotate and is not used for logging attendance sessions.
- **No Liveness Detection**: The face recognition pipeline does not perform active liveness checks or anti-spoofing verification.
- **Matching Distance Threshold**: Face embedding comparisons use a Euclidean distance threshold of `0.6` against registered 128-dimensional facial vectors.
