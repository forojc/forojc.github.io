import React, { useState } from 'react';

import logo from './logo.svg';
import './App.css';

function App() {
  const ONE_DAY = 1000 * 60 * 60 * 24

  const commissionNoApplyDate = new Date("2020-03-01")
  const holidays = [
    "2020-01-01",
    "2020-01-24",
    "2020-01-25",
    "2020-01-27"
  ] // 추석
  const scheduleKeys = [
    'monWedFri',
    'tueThuSat',
    'tueThu',
    'monToFri',
    'monToSat',
    'everyday',
  ]
  const scheduleValues = [
    '주 3회(월/수/금)',
    '주 3회(화/목/토)',
    '주 2회(화/목)',
    '주 5회(월~금)',
    '주 6회(월~토)',
    '매일(월~일)',
  ]
  const schedules = [
    // 일 - 월 - 화 - 수 - 목 - 금 - 토
    [1, 3, 5],
    [2, 4, 6],
    [2, 4],
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5, 6],
    [0, 1, 2, 3, 4, 5, 6]
  ]

  const [schedule, setSchedule] = useState([]) // contains list of indices of schedules
  const [stopDate, setStopDate] = useState("2020-02-26")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [extendDates, setExtendDates] = useState([[undefined, undefined], [undefined, undefined], [undefined, undefined]])  // [["2020-02-02", "2020-03-01"], ...]
  const [extendedEndDate, setExtendedEndDate] = useState("")
  const [payAmount, setPayAmount] = useState(0)

  const [totalDates, setTotalDates] = useState([])
  const [usedDates, setUsedDates] = useState([])
  const [refundTargetFee, setRefundTargetFee] = useState(0)

  const [dailyFee, setDailyFee] = useState(0)
  const [usedFee, setUsedFee] = useState(0)
  const [commission, setCommission] = useState(0)
  const [refundFee, setRefundFee] = useState(0)

  function toMyString(dateObj) {
    var month = dateObj.getMonth() + 1
    var date = dateObj.getDate()
    return [
      dateObj.getFullYear(),
      `${month < 10 ? '0' : ''}${month}`,
      `${date < 10 ? '0' : ''}${date}`
    ].join('-')
  }

  function handleStopDateChange(e) {
    setStopDate(e.target.value)
  }

  function handleStartDateChange(e) {
    setStartDate(e.target.value)
  }

  function handleEndDateChange(e) {
    setEndDate(e.target.value)
    setExtendedEndDate(e.target.value)
  }

  function handlePayAmountChange(e) {
    setPayAmount(e.target.value)
  }

  function handleExtendChange(e, row, col) {
    var items = [...extendDates]
    items[row][col] = e.target.value
    setExtendDates(items)

    // add it to end date
    var newEndDate = new Date(endDate)
    items.forEach(dates => {
      if (dates[0] && dates[1]) {
        var differenceMs = Math.abs(new Date(dates[0]) - new Date(dates[1]))
        var diffDays = Math.round(differenceMs / ONE_DAY) + 1    // TODO: check if 1 should be included
        console.log(diffDays + "일")
        newEndDate.setDate(newEndDate.getDate() + diffDays)
      }
    })

    setExtendedEndDate(toMyString(newEndDate))
  }

  function handleScheduleChange(i) {
    setSchedule(schedules[i])
  }

  /*
  * dayIndex: 0 means Sun, ..., 6 means Sat
  */
  function getDaysBetweenDates(start, end, dayIndex) {
    var result = [];
    // Copy start date
    var current = new Date(start);
    // Shift to next of required days
    current.setDate(current.getDate() + (dayIndex - current.getDay() + 7) % 7);
    // While less than end date, add dates to result array

    while (current <= end) {
      var dateString = toMyString(current)
      if (holidays.indexOf(dateString) === -1) { // it's not in holiday
        // 정지 기간 동안 빼기
        if ((new Date(extendDates[0][0]) <= current && current <= new Date(extendDates[0][1])) ||
            (new Date(extendDates[1][0]) <= current && current <= new Date(extendDates[1][1])) ||
            (new Date(extendDates[2][0]) <= current && current <= new Date(extendDates[2][1]))) {
          // do nothing
        } else {
          result.push(dateString);
        }
      }
      current.setDate(current.getDate() + 7);
    }
    return result;
  }

  function calculate() {
      // TOTAL DAYS
      const newTotalDates = schedule.map(index =>
        getDaysBetweenDates(new Date(startDate), new Date(extendedEndDate), index))
          .flat()
          .sort()
      const totalDays = newTotalDates.length
      // from start date to end date, get list of dates of schedule [월,수,금]
      setTotalDates(newTotalDates)

      // USED DAYS
      const STOPDATE = new Date(stopDate)
      const newUsedDates = newTotalDates.filter(date => new Date(date) < STOPDATE)
      const usedDays = newUsedDates.length
      setUsedDates(newUsedDates)

      // DAILY FEE
      var dailyFee = Math.floor(payAmount / totalDays)
      setDailyFee(dailyFee)

      var usedFee = dailyFee * usedDays
      setUsedFee(usedFee)

      var refundTargetFee = Math.min((totalDays - usedDays) * dailyFee, payAmount)
      setRefundTargetFee(refundTargetFee)

      var newCommission = (new Date(startDate) < commissionNoApplyDate) ?
                        Math.floor(refundTargetFee * 0.025) :
                        0
      setCommission(newCommission)

      var refundFee = refundTargetFee - newCommission
      setRefundFee(refundFee)

  }

  return (
    <div className="App">
      <h1>아빠를 위한 선물같은 계산기</h1>
      <div id="common-info" className="row">
        <label>
          휴관 시작 일자 &nbsp;
          <input type="date" value={stopDate} onChange={handleStopDateChange} />
        </label>
      </div>

      <div id="info">
        <div id="startEndDate" className="row">
          <h3>회원권 정보</h3>
          <label>
            시작일자 (예: 2020-02-01) &nbsp;
            <input type="text" value={startDate} onChange={handleStartDateChange}/>
          </label>
          <br/>
          <label>
            종료일자 (예: 2020-02-01) &nbsp;
            <input type="text" value={endDate} onChange={handleEndDateChange}/>
          </label>
        </div>

        <div className="row">
          <h3>프로그램 종류 선택</h3>
          <div id="programs">
            { scheduleKeys.map((key, i) =>
              <label key={key}>
                <input type="radio" name="schedule" value={key} onChange={() => handleScheduleChange(i)}/>
                { scheduleValues[i] }
              </label>
            ) }
          </div>
        </div>

        <div id="extend" className="row">
          <h3>연기</h3>
          <p>연기 했다면 입력하고, 연장하지 않았다면 입력하지 않으셔도 돼요 (최대 3회)</p>

          {[...Array(3).keys()].map(i =>
            <div className="extend-each" key={i + 1}>
              <table>
                <tr>
                  <td>{i + 1}회 연기 시작일자</td>
                  <td></td>
                  <td>{i + 1}회 연기 종료일자</td>
                </tr>
                <tr>
                  <td>
                    <input type="text"
                           placeholder="예) 2020-02-01"
                           value={extendDates[i][0]}
                           onChange={(e) => handleExtendChange(e, i, 0)} />
                  </td>
                  <td>~</td>
                  <td>
                    <input type="text"
                           placeholder="예) 2020-02-01"
                           value={extendDates[i][1]}
                           onChange={(e) => handleExtendChange(e, i, 1)} />
                  </td>
                </tr>
              </table>
            </div>
          )}

          <div className="row">
            <h4>연장된 후 (확인 전용)</h4>
            <label>
              시작일자
              <input type="text" readOnly={true} disabled={true} value={startDate}/>
            </label>
            <br/>
            <label>
              종료일자
              <input type="text" readOnly={true} disabled={true} value={extendedEndDate}/>
            </label>
          </div>
        </div>

        <div id="payment">
          <h3>결제</h3>
          <label>
            결제금액 &nbsp;
            <input type="number" value={payAmount} onChange={handlePayAmountChange} />&nbsp;원
          </label>
        </div>

        <br/>
        <button onClick={calculate}>계산</button>

        <div id="result">
          <h1>계산 결과</h1>
          <table>
          <thead>
            <tr>
              <th>이용일수<br/>(A)</th>
              <th>전체일수<br/>(B)</th>
              <th>결제액<br/>(C)</th>
              <th>1일 이용금액<br/>(D = C / B)</th>
              <th>사용금액<br/>(E = D * A)</th>
              <th>환불대상액<br/>(F = (B - A) * D)</th>
              <th>카드사 수수료<br/>(G = F * 2.5%)</th>
              <th>환불지급액<br/>(H = F - G)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{ usedDates.length }</td>
              <td>{ totalDates.length }</td>
              <td>{ payAmount }</td>
              <td>{ dailyFee }</td>
              <td>{ usedFee }</td>
              <td>{ refundTargetFee }</td>
              <td>{ commission }</td>
              <td>{ refundFee }</td>
            </tr>
          </tbody>
          </table>

          <hr/>
          <h3>디테일</h3>
          <table>
          <thead>
            <tr>
              <th>전체 일자</th>
              <th>이용 일자</th>
            </tr>
          </thead>
          <tbody>
          { totalDates.map((totalDate, index) =>
            <tr key={`detail${index}`}>
              <td>{ totalDate }</td>
              <td>{ usedDates[index] }</td>
            </tr>
          )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
