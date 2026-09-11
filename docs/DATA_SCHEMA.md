# SmartGlove data schema

## Milestone 1.1 local bridge contract

Milestone 1.1 does not persist samples. FastAPI serializes the existing in-memory `SensorPacket` into bounded columnar WebSocket blocks so the display can consume batches efficiently without changing the domain model.

Each telemetry block contains:

| Field | JSON type | Rule |
|---|---|---|
| `device_id` | string | One block belongs to one device; left/right timelines are never merged. |
| `sequence_numbers` | integer array | Preserves source sequence and gaps. |
| `device_timestamp_ms` | integer array | Device-local timeline. |
| `host_timestamp_ns` | string array | Decimal strings avoid JavaScript integer precision loss. |
| `status_flags` | integer array | One entry per packet. |
| `quality_flags` | integer array | Includes simulated flag. |
| `simulated` | boolean array | Must be true for every current packet. |
| `values` | object of arrays | Exactly 13 raw channel arrays; missing values remain JSON `null`. |

The 13 channel IDs are `flex_thumb_raw`, `flex_index_raw`, `flex_middle_raw`, `flex_ring_raw`, `flex_little_raw`, `fsr_raw`, `accel_x_raw`, `accel_y_raw`, `accel_z_raw`, `gyro_x_raw`, `gyro_y_raw`, `gyro_z_raw` and `distance_mm`.

The bridge schema is versioned separately as `bridge_schema_version=1.0`. It is a local display contract, not hardware protocol v1 and not an authorization to capture a dataset.

## Milestone 1 packet model

Milestone 1 giữ packet trong bộ nhớ; không tạo session hoặc CSV. `SensorPacket` là contract nội bộ chung cho simulator và transport thật ở milestone sau.

| Field | Type | Rule |
|---|---|---|
| `protocol_version` | string | Simulator dùng `sim-1`; protocol phần cứng chưa triển khai. |
| `device_id` | string | Không rỗng, ổn định theo nguồn. |
| `boot_id` | string | Phân biệt lần khởi động/khởi tạo nguồn. |
| `hand` | `left` / `right` | Không suy ra từ màu UI. |
| `sequence_number` | integer | Độc lập cho từng thiết bị, không âm. |
| `device_timestamp_ms` | integer | Clock riêng của thiết bị. |
| `host_timestamp_ns` | integer | Thời gian host nhận/tạo packet. |
| `flex_raw` | 5 integer/null | Thumb, index, middle, ring, little. |
| `fsr_raw` | integer/null | ADC raw. |
| `accel_raw` | 3 integer/null | X/Y/Z raw sensor count. |
| `gyro_raw` | 3 integer/null | X/Y/Z raw sensor count. |
| `distance_mm` | integer/null | Khoảng cách millimetre. |
| `status_flags` | integer | Trạng thái do thiết bị cung cấp trong tương lai. |
| `quality_flags` | bitmask | Cờ do collector bổ sung; simulator có `SIMULATED`. |
| `simulated` | boolean | Luôn `true` với nguồn Milestone 1. |

## Raw CSV dự kiến sau hardware gate

Mỗi dòng tương ứng đúng một packet của một thiết bị. Không ghép hai găng theo sequence, không forward-fill và không thay raw bằng giá trị vật lý.

```text
session_id
subject_id
gesture_id
gesture_display_name
session_hand
repetition_index
attempt_index
hand
device_reported_hand
device_id
boot_id
protocol_version
sequence_number
device_timestamp_ms
host_timestamp_ns
host_monotonic_ns
flex_thumb_raw
flex_index_raw
flex_middle_raw
flex_ring_raw
flex_little_raw
fsr_raw
accel_x_raw
accel_y_raw
accel_z_raw
gyro_x_raw
gyro_y_raw
gyro_z_raw
distance_mm
device_status_flags
quality_flags
simulated
calibration_id
```

Scale/range MPU6050 sẽ nằm trong hello và metadata. Giá trị `g` hoặc `degree/s`, nếu tạo, là field derived trong `data/processed/`.

## Gesture catalog

`configs/gestures.json` có `schema_version=1`. ID phải khớp `^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$`, không trùng và tách khỏi `display_name` Unicode. Milestone 1 chỉ validate catalog; chưa có Data Capture.

## Invariants

- Raw là nguồn gốc duy nhất và không được sửa sau khi hoàn tất session.
- Session thật và simulated không được trộn.
- Timestamp và sequence được theo dõi riêng theo thiết bị.
- Milestone 1 không ghi bất kỳ file sample nào dưới `data/`.
