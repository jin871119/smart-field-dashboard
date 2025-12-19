
import { StoreData } from './types';

export const mockStores: StoreData[] = [
  {
    store: {
      id: "ST-001",
      name: "강남 플래그십 스토어",
      location: "서울특별시 강남구 강남대로 422",
      category: "패션/잡화",
      openedDate: "2023-05-15",
      manager: {
        name: "김철수",
        phone: "010-1234-5678",
        email: "chulsoo.kim@retail.com",
        avatar: "https://picsum.photos/id/64/150/150",
        position: "지점장"
      }
    },
    monthlyPerformance: [
      { month: "1월", revenue: 4500, target: 4000 },
      { month: "2월", revenue: 5200, target: 4800 },
      { month: "3월", revenue: 4800, target: 5000 },
      { month: "4월", revenue: 6100, target: 5500 },
      { month: "5월", revenue: 5900, target: 5800 },
      { month: "6월", revenue: 7200, target: 6500 }
    ],
    itemPerformance: [
      { name: "프리미엄 후디", sales: 1240, growth: 12.5 },
      { name: "캔버스 스니커즈", sales: 850, growth: -2.1 },
      { name: "슬림핏 슬랙스", sales: 2100, growth: 18.2 },
      { name: "린넨 셔츠", sales: 1560, growth: 25.4 },
      { name: "볼캡 모자", sales: 430, growth: 5.8 }
    ]
  },
  {
    store: {
      id: "ST-002",
      name: "성수 테마점",
      location: "서울특별시 성동구 성수이로 20",
      category: "라이프스타일",
      openedDate: "2022-11-10",
      manager: {
        name: "이영희",
        phone: "010-9876-5432",
        email: "younghee.lee@retail.com",
        avatar: "https://picsum.photos/id/65/150/150",
        position: "매니저"
      }
    },
    monthlyPerformance: [
      { month: "1월", revenue: 3200, target: 3500 },
      { month: "2월", revenue: 3800, target: 3500 },
      { month: "3월", revenue: 4100, target: 4000 },
      { month: "4월", revenue: 3900, target: 4200 },
      { month: "5월", revenue: 4500, target: 4300 },
      { month: "6월", revenue: 4800, target: 4500 }
    ],
    itemPerformance: [
      { name: "아로마 디퓨저", sales: 540, growth: 8.5 },
      { name: "세라믹 컵 세트", sales: 320, growth: 15.0 },
      { name: "에코백", sales: 980, growth: 3.2 },
      { name: "다이어리", sales: 210, growth: -5.4 }
    ]
  }
];
