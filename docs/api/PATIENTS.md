# Patient API Documentation

RESTful API endpoints for managing patient records in the clinic system.

**Base URL:** `/api/patients`

## Authentication

Currently no authentication is enforced at the endpoint level. Route protection is handled at the page/layout level via NextAuth. All API calls are expected to originate from authenticated sessions within the application.

---

## Endpoints

### 1. List Patients

**GET** `/api/patients`

Returns a paginated list of all patients, ordered by registration date (newest first).

**Query Parameters**

| Parameter | Type   | Default | Max | Description      |
|-----------|--------|---------|-----|------------------|
| `page`    | number | 1       | —   | Page number      |
| `limit`   | number | 10      | 100 | Items per page   |

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "cm9abc123",
        "noRm": "RM-202604-0001",
        "nik": "1234567890123456",
        "ihs": null,
        "namaLengkap": "John Doe",
        "tempatLahir": "Jakarta",
        "tanggalLahir": "1990-01-01T00:00:00.000Z",
        "jenisKelamin": "LAKI_LAKI",
        "agama": "ISLAM",
        "statusPernikahan": "MENIKAH",
        "jenisPasien": "UMUM",
        "alamatKtp": "Jl. Example No. 123",
        "provinsi": "DKI Jakarta",
        "kabupatenKota": "Jakarta Pusat",
        "kecamatan": "Menteng",
        "desa": "Menteng",
        "pekerjaan": "Karyawan Swasta",
        "perusahaan": "PT Example",
        "noHp": "08123456789",
        "namaWali": null,
        "hubunganWali": null,
        "noHpWali": null,
        "createdAt": "2026-04-01T00:00:00.000Z",
        "updatedAt": "2026-04-01T00:00:00.000Z"
      }
    ],
    "total": 100,
    "page": 1
  }
}
```

**Error Response (500)**

```json
{
  "success": false,
  "error": "Gagal mengambil data pasien.",
  "statusCode": 500
}
```

**Example**

```bash
curl "http://localhost:3000/api/patients?page=1&limit=10"
```

---

### 2. Get Patient by RM Number

**GET** `/api/patients/{noRm}`

**URL Parameters**

| Parameter | Type   | Description                          |
|-----------|--------|--------------------------------------|
| `noRm`    | string | Patient RM number (e.g., `RM-202604-0001`) |

**Success Response (200)**

```json
{
  "success": true,
  "data": {
    "id": "cm9abc123",
    "noRm": "RM-202604-0001",
    "nik": "1234567890123456",
    "namaLengkap": "John Doe",
    "tempatLahir": "Jakarta",
    "tanggalLahir": "1990-01-01T00:00:00.000Z",
    "jenisKelamin": "LAKI_LAKI",
    "agama": "ISLAM",
    "statusPernikahan": "MENIKAH",
    "jenisPasien": "UMUM",
    "alamatKtp": "Jl. Example No. 123",
    "provinsi": "DKI Jakarta",
    "kabupatenKota": "Jakarta Pusat",
    "kecamatan": "Menteng",
    "desa": "Menteng",
    "pekerjaan": "Karyawan Swasta",
    "perusahaan": "PT Example",
    "noHp": "08123456789",
    "namaWali": null,
    "hubunganWali": null,
    "noHpWali": null,
    "createdAt": "2026-04-01T00:00:00.000Z",
    "updatedAt": "2026-04-01T00:00:00.000Z"
  }
}
```

**Error Responses**

| Status | Body |
|--------|------|
| 404 | `{ "success": false, "error": "Pasien tidak ditemukan.", "statusCode": 404 }` |
| 500 | `{ "success": false, "error": "Gagal mengambil data pasien.", "statusCode": 500 }` |

**Example**

```bash
curl "http://localhost:3000/api/patients/RM-202604-0001"
```

---

### 3. Create Patient

**POST** `/api/patients`

Registers a new patient and generates a sequential RM number (`RM-YYYYMM-XXXX`). The endpoint retries up to 3 times on RM number collision (P2002 on `noRm`).

**Request Body**

```json
{
  "nik": "1234567890123456",
  "namaLengkap": "John Doe",
  "tempatLahir": "Jakarta",
  "tanggalLahir": "1990-01-01",
  "jenisKelamin": "LAKI_LAKI",
  "agama": "ISLAM",
  "statusPernikahan": "MENIKAH",
  "jenisPasien": "UMUM",
  "alamatKtp": "Jl. Example No. 123",
  "provinsi": "DKI Jakarta",
  "kabupatenKota": "Jakarta Pusat",
  "kecamatan": "Menteng",
  "desa": "Menteng",
  "pekerjaan": "Karyawan Swasta",
  "perusahaan": "PT Example",
  "noHp": "08123456789",
  "namaWali": "Jane Doe",
  "hubunganWali": "Istri",
  "noHpWali": "08198765432"
}
```

**Required Fields**

| Field             | Type   | Validation                        |
|-------------------|--------|-----------------------------------|
| `nik`             | string | Exactly 16 digits                 |
| `namaLengkap`     | string | Non-empty                         |
| `tempatLahir`     | string | Non-empty                         |
| `tanggalLahir`    | string | ISO date, not future, age 0–150   |
| `jenisKelamin`    | enum   | `LAKI_LAKI` \| `PEREMPUAN`        |
| `agama`           | enum   | See Agama table below             |
| `statusPernikahan`| enum   | See StatusPernikahan table below  |
| `jenisPasien`     | enum   | `UMUM` \| `BPJS`                  |
| `alamatKtp`       | string | Non-empty                         |
| `provinsi`        | string | Non-empty                         |
| `kabupatenKota`   | string | Non-empty                         |
| `kecamatan`       | string | Non-empty                         |
| `desa`            | string | Non-empty                         |
| `pekerjaan`       | string | Non-empty                         |
| `noHp`            | string | 10–13 digits only                 |

**Optional Fields**

| Field          | Type   | Rule                                              |
|----------------|--------|---------------------------------------------------|
| `perusahaan`   | string | Free text                                         |
| `namaWali`     | string | All-or-nothing: if any wali field is present, all three must be provided |
| `hubunganWali` | string | Same as above                                     |
| `noHpWali`     | string | Same as above                                     |

**Success Response (200)**

```json
{
  "success": true,
  "data": { "...patient object..." },
  "message": "Pasien berhasil didaftar. No. RM: RM-202604-0001"
}
```

**Error Responses**

| Status | Condition | Error Message |
|--------|-----------|---------------|
| 400 | Invalid JSON body | `"Format JSON tidak valid."` |
| 400 | Validation failure | `"Validasi gagal: <field>: <reason>; ..."` |
| 409 | NIK already registered | `"NIK sudah terdaftar. Silakan hubungi admin."` |
| 500 | Database error | `"Gagal menyimpan data pasien."` |
| 503 | RM number collision after 3 retries | `"Sistem sedang sibuk (No. RM Collision). Silakan coba lagi."` |

**Example**

```bash
curl -X POST "http://localhost:3000/api/patients" \
  -H "Content-Type: application/json" \
  -d '{
    "nik": "1234567890123456",
    "namaLengkap": "John Doe",
    "tempatLahir": "Jakarta",
    "tanggalLahir": "1990-01-01",
    "jenisKelamin": "LAKI_LAKI",
    "agama": "ISLAM",
    "statusPernikahan": "MENIKAH",
    "jenisPasien": "UMUM",
    "alamatKtp": "Jl. Example No. 123",
    "provinsi": "DKI Jakarta",
    "kabupatenKota": "Jakarta Pusat",
    "kecamatan": "Menteng",
    "desa": "Menteng",
    "pekerjaan": "Karyawan Swasta",
    "noHp": "08123456789"
  }'
```

---

### 4. Update Patient

**PUT** `/api/patients/{noRm}`

Partial update — only fields included in the request body are written. Validation runs before any database lookup, so invalid payloads are rejected with 400 without a DB round-trip.

**URL Parameters**

| Parameter | Type   | Description            |
|-----------|--------|------------------------|
| `noRm`    | string | Patient RM number      |

**Request Body** (all fields optional — same shape as POST)

```json
{
  "noHp": "08999999999",
  "alamatKtp": "Alamat Baru No. 456"
}
```

**Success Response (200)**

```json
{
  "success": true,
  "data": { "...updated patient object..." },
  "message": "Pasien berhasil diperbarui."
}
```

**Error Responses**

| Status | Condition | Error Message |
|--------|-----------|---------------|
| 400 | Invalid JSON | `"Format JSON tidak valid."` |
| 400 | Validation failure | `"Validasi gagal: ..."` |
| 404 | Patient not found | `"Pasien tidak ditemukan."` |
| 409 | NIK taken by another patient | `"NIK sudah terdaftar oleh pasien lain."` |
| 500 | DB error (existence/NIK check) | `"Gagal memeriksa data pasien."` |
| 500 | DB error (update) | `"Terjadi kesalahan pada database."` |

**Example**

```bash
curl -X PUT "http://localhost:3000/api/patients/RM-202604-0001" \
  -H "Content-Type: application/json" \
  -d '{"noHp": "08999999999"}'
```

---

### 5. Delete Patient

**DELETE** `/api/patients/{noRm}`

Hard deletes the patient record. Deletion is blocked (409) if the patient has any linked encounter records. There is no soft delete — once deleted, the record is permanently removed.

**URL Parameters**

| Parameter | Type   | Description       |
|-----------|--------|-------------------|
| `noRm`    | string | Patient RM number |

**Success Response (200)**

```json
{
  "success": true,
  "data": null,
  "message": "Pasien berhasil dihapus."
}
```

**Error Responses**

| Status | Condition | Error Message |
|--------|-----------|---------------|
| 404 | Patient not found | `"Pasien tidak ditemukan."` |
| 409 | Patient has linked encounter data | `"Pasien tidak dapat dihapus karena memiliki data terkait."` |
| 500 | DB error | `"Gagal memeriksa data pasien."` |

**Example**

```bash
curl -X DELETE "http://localhost:3000/api/patients/RM-202604-0001"
```

---

## HTTP Status Code Summary

| Code | Meaning |
|------|---------|
| 200  | Success |
| 400  | Bad Request — invalid JSON or validation failure |
| 404  | Not Found — patient does not exist |
| 409  | Conflict — duplicate NIK or patient has linked records |
| 500  | Internal Server Error — unexpected database or server error |
| 503  | Service Unavailable — RM collision after 3 retries |

---

## Data Types

### JenisKelamin
| Value | Label |
|-------|-------|
| `LAKI_LAKI` | Laki-laki |
| `PEREMPUAN` | Perempuan |

### JenisPasien
| Value | Label |
|-------|-------|
| `UMUM` | Umum |
| `BPJS` | BPJS |

### Agama
| Value |
|-------|
| `ISLAM` |
| `KRISTEN` |
| `KATOLIK` |
| `HINDU` |
| `BUDDHA` |
| `KHONGHUCU` |

### StatusPernikahan
| Value |
|-------|
| `BELUM_MENIKAH` |
| `MENIKAH` |
| `CERAI_HIDUP` |
| `CERAI_MATI` |

---

## Notes

1. **RM Number Format:** `RM-YYYYMM-XXXX` — auto-generated on POST. The sequence is derived from the highest existing RM for that month, so deletions never cause sequence gaps or collisions.
2. **Hard Delete:** There is no `deletedAt` field in the schema. DELETE is permanent and blocked by foreign key constraints if encounter records exist (P2003 → 409).
3. **NIK Validation:** Must be exactly 16 numeric digits.
4. **Guardian Data (Wali):** All-or-nothing — if any of `namaWali`, `hubunganWali`, `noHpWali` is provided, all three are required.
5. **Pagination:** Default `limit` is 10, maximum is 100.
