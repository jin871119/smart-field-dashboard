// performance_data.json 구조 확인 및 계산 테스트
const fs = require('fs');
const performanceData = JSON.parse(fs.readFileSync('performance_data.json', 'utf-8'));

// 매장명 매칭 테스트
const storeName = '롯데본점';
const storeData = performanceData.data.filter(item => {
  const perfStoreName = item.매장명 || '';
  const match = perfStoreName.match(/\(([^)]+)\)/);
  if (match) {
    const nameInBracket = match[1];
    return nameInBracket === storeName || perfStoreName.includes(storeName);
  }
  return perfStoreName.includes(storeName) || storeName.includes(perfStoreName);
});

console.log(`롯데본점 매칭 데이터: ${storeData.length}개`);

// 2025년 데이터 집계
const monthlyData = {};
storeData.forEach(item => {
  const salesPoint = item.판매시점;
  const year = parseInt(salesPoint.substring(0, 4));
  const month = salesPoint.substring(4, 6);
  
  if (year === 2025) {
    if (!monthlyData[month]) {
      monthlyData[month] = 0;
    }
    monthlyData[month] += item.판매액 || 0;
  }
});

console.log('\n2025년 월별 데이터:');
Object.keys(monthlyData).sort().forEach(month => {
  console.log(`  ${month}월: ${(monthlyData[month] / 10000).toFixed(0)}만원`);
});

const yearToDate = Object.keys(monthlyData)
  .filter(month => parseInt(month) <= 11)
  .reduce((sum, month) => sum + monthlyData[month], 0);

console.log(`\n연누계 (1~11월): ${(yearToDate / 10000).toFixed(0)}만원`);
