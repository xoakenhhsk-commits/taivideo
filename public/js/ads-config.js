/**
 * OmniFetch Ads & Monetization Configuration
 * Cấu hình hệ thống quảng cáo & kiếm tiền khi người dùng tải file
 */

const ADS_CONFIG = {
  // 1. Cài đặt đếm ngược trước khi tải (giây)
  countdownSeconds: 5,
  
  // 2. BẬT/TẮT TỰ ĐỘNG MỞ TAB QUẢNG CÁO KHI CLICK NÚT TẢI
  enablePopunderOnDownload: true,

  // 🔥 DIRECT LINK KIẾM TIỀN CHÍNH THỨC CỦA BẠN (Adsterra Direct SmartLink):
  // Khi người dùng bấm bất kỳ nút "Tải về máy", "Tải MP3", tab này sẽ mở để tính tiền cho bạn!
  directPopunderUrl: 'https://www.profitableratecpmnetwork.com/eb3uztr393?key=96265ec7882b8c93c5a280ddc5e156f9',

  // 3. Bật/tắt các vị trí hiển thị quảng cáo khác
  enableModalAd: true,        // Popup quảng cáo đếm ngược
  enableTopBanner: true,       // Banner đầu trang
  enableInCardBanner: true,    // Banner trong khung kết quả tải
  enableStickyBottom: true,    // Banner dính cố định góc dưới
  
  // 4. Nếu bạn dùng Google AdSense, nhập mã tại đây (hoặc để enabled: false)
  googleAdsense: {
    enabled: false,
    client: 'ca-pub-XXXXXXXXXXXXXXXX',
    slotTop: '1234567890',
    slotModal: '0987654321'
  },

  // 5. Danh sách các banner tài trợ hiển thị trong popup đếm ngược & trang web (Tất cả đều dẫn về Direct Link kiếm tiền của bạn!)
  sponsors: [
    {
      id: 'sponsor-cpm-1',
      title: '🔥 Ưu Đãi Tài Trợ Độc Quyền Dành Riêng Cho Bạn Hôm Nay',
      description: 'Nhấn vào đây để nhận gói quà tặng, mã khuyến mãi và trải nghiệm dịch vụ cao cấp hoàn toàn miễn phí!',
      ctaText: 'Khám Phá Ưu Đãi Ngay',
      targetUrl: 'https://www.profitableratecpmnetwork.com/eb3uztr393?key=96265ec7882b8c93c5a280ddc5e156f9',
      badge: 'Được tài trợ',
      bannerImg: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'sponsor-cpm-2',
      title: '⚡ Tăng Tốc Độ Kết Nối & Bảo Vệ Riêng Tư Tuyệt Đối',
      description: 'Mở khóa toàn bộ nội dung không giới hạn tốc độ cao trên mọi thiết bị máy tính và điện thoại.',
      ctaText: 'Kích Hoạt Ngay',
      targetUrl: 'https://www.profitableratecpmnetwork.com/eb3uztr393?key=96265ec7882b8c93c5a280ddc5e156f9',
      badge: 'Khuyên Dùng',
      bannerImg: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'sponsor-cpm-3',
      title: '🎁 Quà Tặng & Voucher Miễn Phí Mỗi Ngày',
      description: 'Cơ hội nhận hàng ngàn phần quà giá trị và voucher ưu đãi độc quyền chỉ trong hôm nay.',
      ctaText: 'Nhận Quà Ngay',
      targetUrl: 'https://www.profitableratecpmnetwork.com/eb3uztr393?key=96265ec7882b8c93c5a280ddc5e156f9',
      badge: 'Ưu Đãi Hot',
      bannerImg: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80'
    }
  ]
};
