# Vòng Vàng Vỡ

Game hành động **souls-like 2D** chạy trên trình duyệt, lấy cảm hứng từ Elden Ring. Code viết tay bằng HTML5 Canvas và JavaScript thuần: không cần thư viện, không cần bước build, và âm thanh được tổng hợp bằng WebAudio.

> Game do người hâm mộ tự làm. Không liên quan tới FromSoftware hay Bandai Namco.

## Chơi thế nào

Mở `index.html` bằng trình duyệt là chơi được. Nếu muốn chạy qua server tĩnh:

```bash
python3 -m http.server 8000
# rồi mở http://localhost:8000
```

Mục tiêu: rời Nhà Nguyện, băng qua Đồng Cỏ Sương Mờ, hạ gục **Varek, Kẻ Canh Cổng Phản Trắc**, rồi đi qua cổng phía bắc để chạm tới **Cây Vàng**.

## Điều khiển

| Hành động | Bàn phím / chuột |
|---|---|
| Di chuyển | `W` `A` `S` `D` hoặc phím mũi tên |
| Chạy nhanh | giữ `Shift` |
| Lăn né (có khung bất tử) | `Space` |
| Đánh thường (combo 3 đòn) | `J` / chuột trái |
| Đánh mạnh | `K` / chuột phải |
| Phép Đá Sao | `L` hoặc `C` |
| Uống Bình Máu | `R` |
| Tương tác (Ân Điển, vật phẩm, lời nhắn) | `E` |
| Khóa mục tiêu | `Q` |
| Gọi / xuống ngựa | `F` |
| Tạm dừng | `Esc` |
| Tắt/bật âm thanh | `M` |

Trên điện thoại, game tự hiện cần điều khiển ảo và các nút bấm.

## Tính năng

- **Chiến đấu kiểu souls:** thanh thể lực, lăn né có khung bất tử, combo đòn nhẹ, đòn mạnh phá thế, đòn chí mạng khi kẻ địch mạnh bị mất thế, và bộ đệm lệnh để nối đòn mượt.
- **Kẻ địch:** Lính Tàn Binh, bầy Sói Xám, Pháp Sư Lưu Đày bắn đạn phép, và Kỵ Sĩ Tro Tàn (tinh anh). Mỗi đòn đánh đều có thời gian vung báo trước.
- **Boss hai giai đoạn:** Varek có đòn đánh chậm một nhịp, nhảy đập, ném dao vàng, và khi còn nửa máu thì dùng thêm búa vàng tạo sóng xung kích và mưa ánh sáng.
- **Ân Điển:** nghỉ ngơi để hồi máu và Bình Máu (kẻ địch cũng hồi sinh), lên cấp bằng rune, và dịch chuyển giữa các Ân Điển đã tìm thấy.
- **Chết thì mất rune:** rune rơi tại chỗ bạn chết. Quay lại nhặt trước khi chết lần nữa.
- **Thế giới mở:** 4 vùng, 4 Ân Điển, Hạt Vàng (thêm lượt Bình Máu), Đá Rèn Kiếm (cường hóa vũ khí), lời nhắn gợi ý trên mặt đất, và ngựa linh để đi nhanh.
- **Tự động lưu** vào `localStorage` khi nghỉ ở Ân Điển, nhặt vật phẩm, chết hoặc hạ boss.

## Cấu trúc

```
index.html   giao diện, menu, CSS
game.js      toàn bộ logic: thế giới, người chơi, AI, boss, hiển thị, âm thanh
```
