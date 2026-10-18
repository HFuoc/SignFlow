# Auto và bản xem chuyển động TCN — cập nhật 18/10/2026

Theo yêu cầu mới, **đã bật Auto cho TCN** và thêm **Landmark replay** cho25từ.
Khởi động lại app → Studio → Dataset → Live Camera → chọn TCN.
Ở Landmark replay, chọn từ → Replay reference; chọn0.5×để xem chậm. Bản dựng
có góc nhìn toàn thân trên và hai ô ngón tay phóng to, xanh=tay trái, cam=tay phải.
Nguồn không soi gương; preview webcam vẫn soi gương như trước.

Start camera → Auto on → chờ sẵn sàng → thực hiện một ký hiệu trọn vẹn → giữ
yên tay khoảng nửa giây → chờ kết quả rồi thực hiện ký hiệu tiếp theo. Có overlay
tracking. Đoạn quá dài/mất khung hình sẽ bị bỏ; Auto không đoán khi động tác còn
đang diễn ra. Capture thủ công vẫn có sẵn khi tắt Auto. Model/ngưỡng không đổi.

**Tên từ không đủ để biết cách ký hiệu. Bản landmarks cũng chưa thay thế video
người thật đã kiểm chứng.** Đây là hình dựng lại từ đúng đoạn train, không phải
video gốc hay hướng dẫn VSL chuẩn. Nó giúp kiểm tra model đang học chuyển động gì;
vẫn cần RGB gốc hoặc người biết VSL xác minh. Chưa tìm được đường tải RGB tương ứng
trong [nguồn GH](https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation).
Không tự lấy video cùng tên từ từ nguồn khác và khẳng định cách ký hiệu tương đương.

Kiểm tra kỹ thuật:341pytest,74Vitest,build/launcher smoke và browser test với
Capture+phát tham chiếu+Auto đều qua. Camera giả lập không có tay không phát từ.
Đã giải mã đủ25clip/731frame; đây không phải bằng chứng nhận diện đúng webcam thật.

# Test TCN25+OTHER trên webcam — trạng thái Capture trước cập nhật Auto

Đã tích hợp checkpoint **TCN epoch44, 25 từ + OTHER** thành lựa chọn thử nghiệm
trong app theo yêu cầu của bạn. Chạy hoàn toàn cục bộ bằng worker CPU hiện có;
không cần API key. Chưa có kết quả đo độ chính xác trên webcam thật.

1. Đóng app đang chạy và mở lại bằng `./run_app.ps1`.
2. Vào **Studio → Dataset → Live Camera**.
3. Ở **Recognition model**, chọn **TCN · 25 signs + OTHER (Experimental)**.
4. Mở **25 supported signs** để xem bộ từ mới; chọn **Start camera**.
5. Để thân trên và hai tay trong hình. Chọn **Capture sign**, đợi đếm ngược,
   thực hiện một ký hiệu hoàn chỉnh. Chọn **Finish capture** khi xong hoặc chờ
   hết 4 giây; không lặp nhiều lần cùng một ký hiệu trong clip.
6. Chờ kết quả rồi chọn **Capture again**. Lần đầu cần khởi động worker và
   MediaPipe; các lần sau tái sử dụng worker/model.

Auto và overlay trực tiếp chưa hỗ trợ TCN. Không dùng video tham khảo của bộ
ViSign cũ để đối chiếu bộ từ mới; nguồn GH hiện chỉ có landmarks, chưa có RGB
tham khảo được kiểm chứng. Có thể chọn lại model cũ trong cùng danh sách.

Bộ 25 từ theo đúng thứ tự nhãn gốc:
TÔI, KHÁM, ĐẾN, BỆNH, CÓ, ĐO, HUYẾT-ÁP, MUỐN, RỒI, BÁC-SĨ, CẢM-THẤY, CẦN,
GIẤY, CHƯA, MẠCH, NỘP, SỐ, VIẾT, ĐÂY, BẢO-HIỂM, ĐAU, ĐI, ĐỢI, Ở-ĐÂU, PHÒNG.

OTHER là lớp từ chối, không phải từ thứ26. Khi không đủ chắc chắn app sẽ báo
không nhận diện được; ngưỡng đang giữ đúng thí nghiệm S05, không tự hạ để tăng
số lần hiện chữ. Có thể có nhiều lần từ chối và vẫn có dự đoán sai. Để đánh giá
nhiều người, ghi riêng số đúng/sai/từ chối trên từng người, gồm các từ ngoài25
và trạng thái nghỉ; không tính riêng những lần app có hiện kết quả.

Đã đối chiếu4.541 mẫu bằng chính hàm suy luận/worker CPU2.5.1: không lệch nhãn
so với dự đoán offline đã lưu, giữ nguyên thống kê chấp nhận/từ chối S05/S06.
Đã kiểm thử trình duyệt với camera giả lập hai lần Capture: đúng provider,
khóa Auto và từ chối clip không có tay. Những kiểm tra này xác nhận tích hợp,
không xác nhận độ chính xác webcam. Báo cáo kỹ thuật: `WORK_SESSION_HANDOFF.md`.

# Kết quả tiếp tục phiên: huấn luyện nhiều người và kiểm tra ngoài từ vựng — 18/10/2026

**Đã tải dữ liệu và huấn luyện thực tế. Chưa đủ bằng chứng để thay mô hình nhận
dạng qua webcam đang dùng.** Bạn đã cho phép chọn lại 25 từ, nên thí nghiệm
không còn bị giới hạn bởi danh sách 25 từ cũ.
Nguồn được chọn là [VSL-GH](https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation),
gồm dữ liệu landmark tải trực tiếp, 6 mã người thực hiện và giấy phép MIT do tác
giả công bố. Danh sách thiên về giao tiếp y tế do độ phủ của nguồn, chưa đại diện
toàn bộ ngôn ngữ ký hiệu Việt Nam (VSL).

## Dữ liệu và 25 từ đã chọn

Tôi, Khám, Đến, Bệnh, Có, Đo, Huyết áp, Muốn, Rồi, Bác sĩ, Cảm thấy, Cần,
Giấy, Chưa, Mạch, Nộp, Số, Viết, Đây, Bảo hiểm, Đau, Đi, Đợi, Ở đâu, Phòng.
File nhãn giữ nguyên chữ hoa và dấu gạch nối của nguồn; tên trên chỉ để dễ đọc.

- Đã tải 1.342 file NPY, tổng cộng 255.297.560 byte; tất cả khớp Git blob/SHA256.
- Giữ nguyên việc loại 2.100 bản ghi có nhãn không nhất quán và 10 nhóm feature
  xung đột từ đợt kiểm tra trước; không dùng lại các nhóm đó để huấn luyện.
- Sau khi giới hạn 40 đoạn/từ/người và kiểm tra toàn bộ mốc thời gian, độ dài,
  còn 1.736 mẫu train, 174 mẫu validation và 176 mẫu test. Loại 3 bản ghi có mốc
  không hợp lệ và 2 đoạn quá ngắn; tổng cộng 6 đoạn đã chọn bị loại. Cả 25 nhãn
  vẫn đủ 6 người và ít nhất 3 mẫu ở mỗi tập validation/test.
- S01–S04 chỉ thuộc train; S05 chỉ thuộc validation; S06 chỉ thuộc test. Không
  phát hiện đầu vào đã mã hóa trùng hoàn toàn trong 2.086 mẫu. Kiểm tra này chưa
  loại trừ các bản biến đổi gần giống nhau.
- Đã xác nhận 8.113 mốc cắt từ 2.100 bản ghi hợp lệ khớp timestamp; mã nguồn dùng
  `[start:end]`. RGB không được công bố nên chưa kiểm chứng căn chỉnh hình/nhãn.

Mã chuẩn hóa của tác giả dùng nhầm chỉ số khuỷu tay cho vai. Pipeline thử nghiệm
đã dùng đúng chỉ số vai 9/10 trong bố trí 137 điểm, không chạy mã huấn luyện hay
mã tiền xử lý của tác giả. Đây là phát hiện trong mã nguồn dataset, không phải
kết luận về nguyên nhân lỗi của app hiện tại. Feature mới giữ mặt nạ chỉ điểm
bị thiếu, tọa độ theo cơ thể và đặc trưng hình bàn tay.

## Kết quả phân loại trong phạm vi 25 từ

| Mô hình | Validation macro-F1 | Test đúng / 176 | Test macro-F1 |
| --- | ---: | ---: | ---: |
| Ridge baseline, alpha 100 | 0,8541 | 163/176 (92,61%) | 0,9052 |
| TCN, epoch 43 | 0,8574 | 159/176 (90,34%) | 0,8895 |

TCN được chọn bằng validation trước khi chấm test; không đổi lựa chọn vì thấy
Ridge đạt điểm test cao hơn. Đây là mức khớp nhãn nguồn trên một người chưa có
trong train, với biên từ đã được cung cấp. Kết quả không phải độ chính xác của
webcam/Auto và không thể so trực tiếp với 81,2% của mô hình cũ, vì khác nguồn,
nhãn và cách chia dữ liệu.

## Thử học thêm lớp ngoài từ vựng

Phép thử bổ sung lấy các ký hiệu ngoài 25 từ từ những bản ghi đã tải: 2.055 mẫu
train, 204 mẫu validation và 196 mẫu test, thuộc tổng cộng 193 nhãn nguồn khác
nhau. Giữ nguyên danh sách 25 từ và thêm một lớp huấn luyện `__OTHER__`. Loại
4 đoạn train quá ngắn; không giữ lại bản sao raw/encoded xung đột với các mẫu
trong từ vựng. Tập dữ liệu thứ hai có 3.791/378/372 mẫu train/validation/test.
Validation chọn TCN tại epoch 44. Các đoạn ngoài từ vựng vẫn thuộc bối cảnh y tế
của nguồn.

Ngưỡng được chọn bằng S05, với mức nhận nhầm mẫu ngoài từ vựng không quá 5%
trong thí nghiệm; đây chưa phải tiêu chí sản phẩm bạn đã phê duyệt. Bảng dưới
so sánh trên cùng 176 mẫu trong từ vựng (known) và 196 mẫu ngoài từ vựng (unknown)
của S06:

| Kết quả | Chỉ học 25 từ | Học 25 từ + OTHER |
| --- | ---: | ---: |
| Known được nhận đúng | 39/176 (22,16%) | 94/176 (53,41%) |
| Known được nhận sai | 0 | 1 |
| Known bị từ chối | 137 | 81 |
| Unknown bị nhận thành từ known | 11/196 (5,61%) | 11/196 (5,61%) |
| Macro false-accept theo nhãn unknown | 6,44% | 3,98% |

Tỷ lệ nhận đúng trên toàn bộ mẫu known tăng 31,25 điểm phần trăm trong phép thử
này. Tỷ lệ đúng trong số kết quả được trả về của bản OTHER là 94/95 (98,95%),
nhưng **không được gọi 98,95% là độ chính xác tổng thể**, vì 81/176 mẫu known
bị từ chối.

Nếu chỉ lấy lớp có điểm cao nhất (argmax) của bản OTHER, không thêm ngưỡng:
153 mẫu đúng, 9 mẫu sai và 14 mẫu bị từ chối trên 176 mẫu known; tuy nhiên,
56/196 mẫu unknown bị nhận nhầm (28,57%). Vì vậy cần đo đồng thời nhận đúng,
nhận nhầm và từ chối, thay vì chỉ công bố điểm phân loại 25 lớp.

**Giới hạn:** phép thử OTHER được thiết kế sau khi đã xem test lần đầu, nên
so sánh này mang tính thăm dò, không phải kiểm chứng độc lập mới. Mô hình và
ngưỡng vẫn chỉ được huấn luyện/chọn trên train/validation. Một người test, vài
mẫu mỗi từ và dữ liệu cùng bối cảnh chưa chứng minh khả năng tổng quát trên
nhiều webcam. Unknown không bao gồm đứng yên, động tác đời thường, mất tracking
hoặc chuyển tiếp giữa động tác. Nhãn VSL chưa được duyệt thủ công.

## Workflow tiếp theo dựa trên kết quả

1. Dùng nguồn có mã người thực hiện (signer ID), kiểm tra hash và mốc cắt như
   thí nghiệm này. Duy trì danh sách 25 từ có phiên bản, rồi mở rộng bằng cùng
   hợp đồng dữ liệu.
2. Huấn luyện với ký hiệu ngoài từ vựng ngay từ đầu. Giữ mọi đoạn cắt và bản
   biến đổi của cùng một người trong cùng tập; chỉ tăng cường dữ liệu train.
   Đo macro-F1 và kết quả theo từng nhãn/người.
3. Chọn mô hình và chính sách từ chối bằng validation, đồng thời báo tỷ lệ nhận
   đúng trên toàn bộ lượt thử. Không chỉ tối ưu precision trên ít lượt được nhận.
4. Lần kiểm chứng tiếp theo cần người và bản ghi độc lập, clip chứa đầy đủ động
   tác, trạng thái đứng yên (idle) và ký hiệu ngoài 25 từ. Kiểm tra Capture trước,
   rồi Auto để tách lỗi phân loại khỏi lỗi xác định biên thời gian. Không dùng
   lại S06 đã xem như một tập test kín mới.
5. Chỉ đổi mô hình trong app khi kết quả webcam độc lập cải thiện và tỷ lệ trả
   kết quả đủ dùng. Hiện 81 lượt từ chối còn quá nhiều để khẳng định đã giải quyết
   yêu cầu.

Nguồn [VSL400 chính thức](https://zenodo.org/records/17943574) hiện yêu cầu
[thỏa thuận truy cập](https://zenodo.org/records/21366957); bản mirror trên Kaggle
chưa được dùng để huấn luyện trong phiên này. VSL-GH cho phép bắt đầu thí nghiệm
ngay, nhưng không thay thế bằng chứng từ RGB/webcam và nhiều người độc lập hơn.

## File, kiểm thử và chạy lại

Mã nguồn bền vững: `app/desktop_collector/vsl_gh_experiment.py`.
23 test mới nằm trong `tests/test_vsl_gh_experiment.py`. Không thêm dependency
vào app. 127 test liên quan đã PASS (16,13 giây); shell smoke PASS.
Frontend/build không chạy vì không thay đổi UI.
Hai lượt replay CPU riêng đã tải lại toàn bộ labels/mean/scale/weights và tái tạo
đúng mọi dự đoán cho 2.086 và 4.541 mẫu, với cả Ridge và TCN.

Artifact nằm riêng tại `.design-cache/multiuser-data-20261018/gh25/`:
`selection.json`, `protocol.json`, `sample-plan.json`, `download-receipts.json`,
`prepared/`, `run1/`, `background-protocol.json`, `background-prepared/`,
`background-run1/`, `comparison-results.json`, `replay.json`, `background-replay.json`.
`comparison-results.json` là nguồn so sánh cuối cùng; bản unknown-results ban đầu
được giữ nguyên. So sánh cuối dùng float64 để xét ngưỡng chính xác và có ngưỡng
từ chối toàn bộ, tránh làm tròn float32 sát 1.0. Các ngưỡng này chưa áp dụng vào app.

Lệnh huấn luyện lại phải dùng output mới, không ghi đè run đã có:

```powershell
.\.design-cache\kvsl-phase0a\extraction-env\Scripts\python.exe -X utf8 .design-cache/multiuser-data-20261018/gh25/run_training.py train --dataset .design-cache/multiuser-data-20261018/gh25/background-prepared/dataset.npz --audit .design-cache/multiuser-data-20261018/gh25/background-prepared/audit.json --output .design-cache/multiuser-data-20261018/gh25/background-run2
```

Lệnh kiểm tra checkpoint đã lưu, không huấn luyện lại:

```powershell
.\.design-cache\kvsl-phase0a\extraction-env\Scripts\python.exe -X utf8 .design-cache/multiuser-data-20261018/gh25/run_training.py replay --model-dir .design-cache/multiuser-data-20261018/gh25/background-run1 --dataset .design-cache/multiuser-data-20261018/gh25/background-prepared/dataset.npz --output .design-cache/multiuser-data-20261018/gh25/background-replay.json
```

Không mở webcam, không đọc API key, không đổi launcher, mô hình mặc định hay
danh sách từ trong UI. Thư mục hiện không có Git metadata; không tuyên bố
worktree sạch. Các phần dưới là lịch sử khảo sát; quyết định giữ 25 từ cũ hoặc
đang chờ trả lời đã được cập nhật ở đầu tài liệu.

---

## 2026-10-18 - User permits replacing the MVP vocabulary; multi-user experiment active

User explicitly answered: "Có thể chọn lại 25 từ từ dataset tốt". This supersedes
the pending vocabulary question and the requirement to keep the original25.
Select25 source-supported glosses for offline research; keep expansion possible.
Production accuracy acceptance, numerical thresholds and model cutover remain open.

Current experiment: VSL-GH public MIT landmark data,25 source glosses with at least
three source validation/test recordings each. Preserve S01–S04 train, S05 validation,
S06 test; exclude conflicting metadata/duplicate feature annotations before fitting.
Freeze label selection, sampling and evaluation protocol before predictions.
Source-label research is authorized without completed manual semantics review;
this does not establish label correctness, frame alignment or webcam accuracy.

Evidence/protocol: `.design-cache/multiuser-data-20261018/gh25/`.
Dataset: https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation
This decision does not require a second vocabulary approval. Physical multi-user
webcam, unknown/idle and Auto evaluation remain the next model cutover gate.

# Dữ liệu VSL cho MVP nhiều người dùng — 2026-10-18

Mục tiêu đã được người dùng xác nhận: nhận diện ngôn ngữ ký hiệu Việt Nam cho
nhiều người dùng, bắt đầu với 25 từ và mở rộng sau đó. Nghiên cứu dataset công
khai, chuẩn bị dữ liệu và huấn luyện thử đã được cho phép. Độ chính xác thực tế,
ngưỡng nghiệm thu và thay model mặc định vẫn chưa được nghiệm thu.

**Kết quả phiên này:** tìm thấy nguồn bổ sung có thể truy cập ngay, tải metadata
và 50 video để kiểm chứng; phát hiện rò rỉ người thực hiện trong các split có sẵn;
chạy model hiện tại trên nguồn video khác. Chưa huấn luyện model mới và chưa có
bằng chứng cải thiện độ chính xác webcam. Không coi việc tải thêm file là cải thiện.

## 1. Nguồn dữ liệu đã kiểm tra trực tiếp

| Nguồn | Bằng chứng thực tế | Vai trò phù hợp và giới hạn |
| --- | --- | --- |
| [VSL Cropped, Kaggle, bản 8](https://www.kaggle.com/datasets/nguyenanfms/vsl-vietnamese-sign-language-v2) | Đọc danh mục ZIP 191.160 file bằng HTTP Range; tải train/test, nhánh tăng cường và 7 metadata góc chính diện. Nhánh canonical có 26.446 mẫu/472 nhãn. | Có RGB và keypoint; cần chia lại theo người, kiểm tra chất lượng và xác nhận điều kiện của phần VSL400. Không tải cả archive 80,63 GB. |
| [VSL50, Kaggle, bản 1](https://www.kaggle.com/datasets/lamtrannhut7105/vsl50) | Tải cả ba CSV chia tập: 4.846 mẫu, 50 nhãn, 20 signer ID, ba góc nhìn. Danh mục chứa tensor RGB `.pt`. | Cả 4.846 dòng khớp video ID, nhãn và signer trong metadata VSL400 đã lấy; đây không phải nguồn người thực hiện mới độc lập. Train/test chung 19 signer; validation/test còn chứa mẫu tăng cường. |
| [VSL-word, Kaggle, bản 1](https://www.kaggle.com/datasets/ngamcphuong/vsl-word) | Danh mục ZIP có 2.717 file RGB `_color.avi`, 28 thư mục nhãn chính, kèm depth/text. Đã tải 50 RGB, 20.482.266 byte; giải mã đủ 2.258 frame. | Dùng được ngay cho khảo sát RGB khác nguồn. Chưa có signer ID được xác minh trong phần metadata đã kiểm tra. Năm thư mục ánh xạ ứng viên sang từ hiện tại; không đủ một benchmark đa người cho toàn bộ 25 từ. |
| [VSL/QIPEDC trên Kaggle](https://www.kaggle.com/datasets/aresusayhi/vsl-vietnamese-sign-languages) và [MilkyVic trên GitHub](https://github.com/MilkyVic/Vietnamese-Sign-Language-Recognition) | Metadata/API và CSV tải được. GitHub có poster/CSV nhưng không có thư mục video RGB trong tree đã kiểm tra. Nhiều bản khác dùng cùng tên file QIPEDC. | Bổ sung từ điển/tham khảo; không đếm các bản sao là người thực hiện mới. Dữ liệu KVSL cũ cũng xuất phát từ QIPEDC. |
| [VSL-GH](https://github.com/nguyentheanh822/Vietnamese-Sign-Language-Translation) | Keypoint và metadata công khai; audit trước giữ 2.100 dòng nhất quán, loại 2.100 dòng lỗi. Đối chiếu từ hiện tại cho 8 nhãn sau chuẩn hóa chữ hoa/dấu nối để tra cứu. | Có phân chia S01–S04/S05/S06 nhưng thiếu RGB để xác minh trích xuất và biên từ. Không tự gộp feature 137 điểm với hợp đồng 75 điểm của app. |
| [Multi-VSL](https://github.com/Etdihatthoc/Multi-VSL_WACV_2025) | Issue phát hành đầy đủ vẫn mở; các phản hồi đến tháng 9/2026 tiếp tục nêu chỉ có khoảng 1.000 video demo. Audit trước đã tải/giải mã ba mẫu. | Không quảng bá 84.764 video trong bài báo như dữ liệu đã tải được cho dự án. [Issue nguồn](https://github.com/Etdihatthoc/Multi-VSL_WACV_2025/issues/1). |
| [ViSL-News](https://huggingface.co/datasets/kha2612/ViSL-News) | HF tree chỉ có README và ba CSV train/val/test; README nói không phân phối video gốc. | Không phải nguồn RGB gắn nhãn từ đơn có thể train ngay. |

Các nguồn `mcphngnga/dataset-vsl`, `cuongnk9104/vsl-v2`,
`vongocbao1309/vietnamese-sign-language` được kiểm tra thêm: các file đầu gồm ảnh
chữ cái, trong đó nguồn cuối còn chứa thư mục ASL. Không dùng nhãn tên dataset
để suy ra đó là video từ vựng VSL. `ngannguyen65/vietnamese-sign-language` có
video chữ cái; `dnghmnh/vsl-dataset` có thêm video từ điển nhưng CSV không cung
cấp signer ID. Các nguồn chỉ có feature/tensor chưa được coi là RGB mới đã giải mã.

### Điều kiện sử dụng cần phân biệt

Kaggle VSL Cropped khai báo CC BY 4.0; VSL50 khai báo CC0. Nguồn VSL400 chính
thức hiện yêu cầu [Data Usage Agreement](https://zenodo.org/records/21366957)
cho video và dữ liệu dẫn xuất từ người. [Trang chính thức](https://zenodo.org/records/17943574)
ghi quyền truy cập được kiểm soát. Chưa có bằng chứng giải quyết khác biệt về
quyền phân phối giữa các bản mirror và nguồn gốc. Vì vậy phiên này chỉ kiểm tra
metadata của phần VSL400, chưa tải video/tensor để train hoặc phân phối lại.
Đây là vấn đề nguồn dữ liệu cụ thể, không phải yêu cầu mua API hay thu dữ liệu cá nhân.

VSL-word khai báo Apache 2.0 trên Kaggle. Video mẫu được giữ trong cache nghiên
cứu; không thêm vào ứng dụng hoặc công bố lại. Nhãn thư mục vẫn là nhãn nguồn,
chưa được người thông thạo VSL xác nhận.

## 2. Độ phủ đúng 25 từ đang có

Trong nhánh canonical của VSL Cropped:

- Có 1.342 dòng cho 25 từ hiện tại.
- 786 dòng khớp ID và nhãn với metadata VSL400, phủ **13/25 từ**, mỗi từ có 26
  signer ID trong phần metadata này. Con số 26 là đếm thực tế của bản mirror,
  không thay cho con số 28 người trong mô tả bộ gốc.
- 556 dòng còn lại đều có cặp tên nhãn/tên file đã xuất hiện trong archive
  ViSignLanguage-Video có sẵn. Đây là bằng chứng trùng định danh, chưa phải kiểm
  tra trùng pixel của từng file; không được tính là 556 clip độc lập mới.
- 12 từ chưa có dữ liệu bổ sung với signer ID trong nguồn này:
  **Chào, Chúng ta, Có thể, Cứu, Giúp, Mua, Nhìn, Nhớ, Thăm, Thức ăn, Tôi, Đâu**.
- Không tự đổi `Giúp` thành `Giúp đỡ`, `Mua` thành `Mua bán`, hoặc gộp các từ gần
  nghĩa để làm số liệu độ phủ đẹp hơn. Danh sách từ trong app giữ nguyên.

Nhánh canonical và nhánh augmented **đều chung cả 26 signer ID giữa train/test**.
Không thấy trùng recording ID giữa hai tập trong metadata của từng nhánh; điều
này vẫn không đủ bảo đảm kiểm thử trên người mới. Không dùng kết quả của split
này để tuyên bố khả năng tổng quát hóa sang người chưa thấy.

Đã tạo **đề xuất** chia lại 786 mẫu có signer ID theo 20 người train, 3 người val,
3 người test: **586/112/88 mẫu**, giữ 13 nhãn có dữ liệu. Quy tắc SHA256 cố định
trên signer ID được đặt trước mọi dự đoán trên nguồn này. Đây chỉ là manifest
nghiên cứu, chưa tải media, chưa chấp nhận ngữ nghĩa/quyền sử dụng, chưa phải MVP
13 từ và chưa thay đổi các tập dữ liệu cũ. Cả 12 nhãn thiếu được ghi rõ.

## 3. Thử model hiện tại trên nguồn RGB bổ sung

Chọn trước 10 số thứ tự phân bố đều trong mỗi thư mục `1.An`, `21.Uong`,
`25.Chao`, `27.CamOn`, `28.XinLoi`. Chạy checkpoint VideoMAE đang ghim trong app,
giữ nguyên 100 đầu ra gốc, tiền xử lý và ngưỡng điểm. Không fine-tune hoặc chọn
clip theo kết quả model.

| Nhãn thư mục ánh xạ ứng viên | Đúng top-1 / số clip |
| --- | ---: |
| Ăn | 3/10 |
| Uống | 8/10 |
| Chào | 5/10 |
| Cảm ơn | 0/10 |
| Xin lỗi | 0/10 |
| Tổng | **16/50 (32%)** |

Cả 50 bị chính sách điểm hiện tại từ chối. Đây là kiểm thử classifier và ngưỡng
điểm; chưa chạy điều kiện tracking tay, Auto, webcam hoặc toàn bộ đường Capture.
50 clip có hash file khác nhau và không trùng hash file trong archive ViSign
cũ. Điều đó không chứng minh không trùng người hoặc không có bản biến đổi cùng
video. Nhãn nguồn chưa duyệt; số liệu là mức khớp nhãn nguồn, không phải độ
chính xác VSL đã được xác nhận. 50 clip hiện là tập chẩn đoán đã xem kết quả,
không được dùng như tập test kín cho lần tối ưu tiếp theo.

Ảnh contact sheet lấy từ frame thật cho thấy khác biệt về khung hình và tỉ lệ
người trong ảnh. Chưa có phép thử tách riêng ảnh hưởng của khung hình, nền,
người thực hiện, cách ký hiệu và biên thời gian. Không quy toàn bộ lỗi cho crop.

## 4. Workflow được đề xuất

1. Giữ một bảng nhãn VSL có phiên bản, nguồn video, recording ID, signer ID,
   quyền sử dụng và trạng thái duyệt. Chốt 25 từ chỉ sau khi mỗi từ có dữ liệu
   đủ để đánh giá nhiều người. Nếu đổi danh sách từ, ghi rõ đó là quyết định mới.
2. Chia train/validation/test theo **người thực hiện trước khi tăng cường dữ liệu**.
   Giữ mọi góc máy, clip cắt và bản tăng cường cùng một recording trong một tập.
   Dữ liệu không biết người thực hiện có thể được xem xét cho train riêng, nhưng
   không được dùng làm bằng chứng test trên người chưa thấy; cần kiểm tra trùng
   với cả validation/test trước khi dùng.
3. Kiểm tra chất lượng video và nhãn, giữ mẫu mất tay/hỏng hình ở khu cách ly.
   Với landmark, giữ mask điểm thiếu; dữ liệu nội suy phải được gắn nhãn dẫn xuất,
   không coi `0% missing joints` là phép đo tracking hoàn hảo.
4. Huấn luyện một baseline RGB trên clip hoàn chỉnh và đánh giá theo từng người,
   từng từ. Bắt đầu từ encoder đã có và thử head/fine-tune lớp cuối trong môi
   trường cô lập; độ vừa VRAM RTX 2050 khi huấn luyện chưa được đo. Chỉ bổ sung
   nhánh landmark/chuyển động nếu thí nghiệm có đối chứng cho thấy cải thiện.
5. Chỉ chọn cấu hình bằng validation. Báo cáo macro-F1, recall từng từ và từng
   người; thêm idle, động tác chuyển tiếp và dấu ngoài từ vựng để đo nhận nhầm.
   Sau đó kiểm thử webcam nhiều người độc lập, cả Capture và Auto, rồi mới đổi
   model trong app. LLM không sửa nhãn thị giác dựa trên lời đoán của classifier.
6. Khi mở rộng quá 25 từ, giữ bộ đánh giá các từ cũ và thêm người/từ mới; không
   đánh đồng nhận diện từ đơn với dịch hội thoại ký hiệu liên tục.

Đây là hướng có thể kiểm chứng; chưa có cơ sở gọi một kiến trúc là tối ưu nhất
hoặc hứa trước mức tăng độ chính xác. Với ràng buộc tải ngay, giữ đúng 25 từ và
đánh giá người mới, nguồn đã kiểm tra chưa đồng thời giải quyết đủ ba yêu cầu.

## 5. Công cụ và bằng chứng có thể chạy lại

Thư mục dữ liệu/bằng chứng không đưa vào source:
`.design-cache/multiuser-data-20261018/`.

- `fetch_metadata.py`, `fetch_candidates.py`, `fetch_more.py`, `fetch_v2_metadata.py`,
  `fetch_vsl50.py`: metadata công khai, kèm URL/phiên bản/hash trong receipts.
- `inspect_archive.py`: đọc danh mục ZIP/ZIP64 qua Range, từ chối tải toàn bộ
  khi server không trả 206; giới hạn kích thước danh mục. Không giải nén mã nguồn
  hoặc thực thi file pickle từ nguồn ngoài.
- `cropped-audit.json`, `signer-split-proposal.json`: đối chiếu nguồn và đề xuất
  chia theo người; luôn `training_ready=false` ở bước qualification này.
- `fetch_rgb_samples.py`, `rgb-sample-manifest.json`, `rgb/`: chọn và tải 50 mẫu.
- `probe_rgb.py`, `rgb-probe.json`, `rgb-contact.jpg`: chạy checkpoint ghim và
  bằng chứng giải mã/dự đoán; không mở webcam.

CLI bền vững được bổ sung vào module audit đang có:

```powershell
$rawMetadata = Get-ChildItem .design-cache/multiuser-data-20261018/v2-raw-front-*.json | ForEach-Object { $_.FullName }
.\.venv\Scripts\python.exe -X utf8 -m app.desktop_collector.vsl_data_audit cropped-vsl --train .design-cache/multiuser-data-20261018/v2-train.json --test .design-cache/multiuser-data-20261018/v2-test.json --raw $rawMetadata --augmented .design-cache/multiuser-data-20261018/v2-augmented.json --output .design-cache/multiuser-data-20261018/cropped-audit.json
```

CLI bảo vệ input, phát hiện ID nhập nhằng, kiểm tra nhãn chính xác, truy vết mẫu
tăng cường về recording gốc và báo riêng người không biết. Không sửa nhãn, không
gán người từ tên file số, không tự thông qua huấn luyện.
