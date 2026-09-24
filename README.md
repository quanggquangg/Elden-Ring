# Vòng Vàng Vỡ

Game hành động **souls-like 2D** chạy trên trình duyệt, lấy cảm hứng từ Elden Ring. Code viết tay bằng HTML5 Canvas và JavaScript thuần: không cần thư viện, không cần bước build, và âm thanh được tổng hợp bằng WebAudio.

> Game do người hâm mộ tự làm. Không liên quan tới FromSoftware hay Bandai Namco.

## Chơi thế nào

Mở `index.html` bằng trình duyệt là chơi được. Nếu muốn chạy qua server tĩnh:

```bash
python3 -m http.server 8000
# rồi mở http://localhost:8000
```

Mục tiêu: rời Nhà Nguyện, băng qua Đồng Cỏ Sương Mờ, hạ gục **Varek, Kẻ Canh Cổng Phản Trắc**, rồi đi qua cổng phía bắc để chạm tới **Cây Vàng**. Thử thách phụ: đánh thức **Ignarth, Rồng Tro Cổ Đại** đang ngủ trong Đầm Lầy Tro Độc ở phía đông.

## Điều khiển

Phím được đặt theo Elden Ring bản PC (bố cục mặc định trước bản mở rộng Shadow of the Erdtree). Game không có nút nhảy, nên `Space` dùng cho lăn và chạy như bản gốc.

| Hành động | Bàn phím / chuột | Tay cầm (Xbox / PlayStation) |
|---|---|---|
| Di chuyển | `W` `A` `S` `D` | cần trái |
| Lăn né | nhấn `Space` | nhấn B / ○ |
| Chạy nhanh | giữ `Space` | giữ B / ○ |
| Đánh thường | chuột trái | RB / R1 |
| Đánh mạnh | `Shift` + chuột trái | RT / R2 |
| Đỡ / phản đòn | giữ chuột phải | giữ LB / L1 |
| Phép Đá Sao (vị trí nút Skill) | `Shift` + chuột phải | LT / L2 |
| Uống Bình Máu | `R` | X / □ |
| Tương tác, mở rương | `E` | Y / △ |
| Khóa mục tiêu | `Q` hoặc chuột giữa | R3 |
| Đổi vũ khí | `←` `→` (hoặc `1`–`6`) | D-pad ← → |
| Gọi / xuống ngựa | `F` | A / × |
| Bản đồ | `G` | Back / Share |
| Tạm dừng | `Esc` | Start / Options |
| Tắt/bật âm thanh | `M` | |

Nếu chỉ chơi bằng bàn phím: `J` đánh thường, `K` đánh mạnh, giữ `X` để đỡ, `C` dùng phép. Trên điện thoại, game tự hiện cần điều khiển ảo và các nút bấm.

## Tính năng

- **Chiến đấu kiểu souls:** thanh thể lực, lăn né có khung bất tử, combo đòn nhẹ, đòn mạnh phá thế, đòn chí mạng khi kẻ địch mạnh bị mất thế, và bộ đệm lệnh để nối đòn mượt.
- **Đỡ và phản đòn:** giữ `X` để giơ khiên chặn phần lớn sát thương (tốn thể lực). Nếu giơ khiên đúng lúc kẻ địch vung vũ khí, bạn phản đòn và chúng mất thế, sẵn sàng cho một đòn chí mạng. Rồng không phản đòn được.
- **Đâm lưng:** đánh vào sau lưng kẻ địch chưa phát hiện ra bạn sẽ gây sát thương chí mạng.
- **Vũ khí phải tự đi tìm:** bạn bắt đầu với Kiếm Gãy. Kiếm Thẳng, Uchigatana Tro (gây chảy máu) và Giáo Kỵ Sĩ (đâm xa) nằm trong rương, thường có kẻ địch canh giữ. Hạ Varek nhận Kiếm Vàng Varek (đòn mạnh phóng sóng ánh sáng), hạ rồng nhận Đại Kiếm Nanh Rồng (không bị ngắt đòn). Đổi vũ khí bằng phím mũi tên hoặc ở tab Trang bị khi nghỉ tại Ân Điển.
- **Rương báu:** 6 rương rải rác khắp bản đồ, chứa vũ khí, rune, Đá Rèn Kiếm và Hạt Vàng.
- **Bản đồ (`G`):** hiện các vùng, những Ân Điển đã tìm thấy, vị trí của bạn và chỗ rơi rune.
- **Kẻ địch:** Lính Tàn Binh, bầy Sói Xám, Pháp Sư Lưu Đày bắn đạn phép, Thây Ma Đầm Lầy (đánh trúng sẽ gây độc), và Kỵ Sĩ Tro Tàn (tinh anh). Mỗi đòn đánh đều có thời gian vung báo trước.
- **Boss hai giai đoạn:** Varek có đòn đánh chậm một nhịp, nhảy đập, ném dao vàng, và khi còn nửa máu thì dùng thêm búa vàng tạo sóng xung kích và mưa ánh sáng.
- **Rồng Ignarth (boss phụ):** phun lửa quét, bay lên rồi lao xuống, bắn cầu lửa, cắn liên hoàn, và quật đuôi nếu bạn đứng sau lưng. Khi còn dưới 40% máu thì nổi điên. Hạ rồng sẽ nhận được đại kiếm.
- **Đầm Lầy Tro Độc:** đứng trong ao tím sẽ tích độc, đầy thanh thì bị trúng độc và mất máu dần. Đi bằng ngựa sẽ không bị ảnh hưởng. Nghỉ ở Ân Điển để giải độc.
- **Ân Điển:** nghỉ ngơi để hồi máu và Bình Máu (kẻ địch cũng hồi sinh), lên cấp bằng rune, và dịch chuyển giữa các Ân Điển đã tìm thấy.
- **Chết thì mất rune:** rune rơi tại chỗ bạn chết. Quay lại nhặt trước khi chết lần nữa.
- **Thế giới mở:** 5 vùng, 5 Ân Điển, Hạt Vàng (thêm lượt Bình Máu), Đá Rèn Kiếm (cường hóa vũ khí), lời nhắn gợi ý trên mặt đất, và ngựa linh để đi nhanh.
- **Tự động lưu** vào `localStorage` khi nghỉ ở Ân Điển, nhặt vật phẩm, chết hoặc hạ boss.

## Cấu trúc

```
index.html   giao diện, menu, CSS
game.js      toàn bộ logic: thế giới, người chơi, AI, boss, hiển thị, âm thanh
```
