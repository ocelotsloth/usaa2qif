/*
 *  usaa2qif: NodeJS Module to Convert USAA Statements to QIF Files
 *  Copyright (C) 2017 Mark Stenglein <mark@stengle.in>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

////
// Set This value for the pdf's you wish to convert.
const pdf_paths = ["sample-statement.pdf"];
////

var fs = require('fs');
var pdfUtil = require('pdf-to-text');
var pdf_path = "test.pdf";
const _ = require('lodash');
const dateCheck = /(0[1-9]|1[0-2])\/(0[1-9]|1[0-2])\/([0-1][1-9])/
var option = {};

function getStatementDate(statementArr) {
  const location = _.findIndex(statementArr, line => {
    return line[0] === 'STATEMENT DATE' || line[1] === 'STATEMENT DATE' || line[2] === 'STATEMENT DATE';
  }) + 2;

  let dateMatch = dateCheck.exec(statementArr[location])

  return {
    'month': dateMatch[1],
    'day': dateMatch[2],
    'year': dateMatch[3]
  }
}

function getTotals(statementArr) {
  /*
   *  [ 'LAST STATEMENT',
   *    'PAID',
   *    'OF DEBITS PAID',
   *    'DEP',
   *    'OF DEPOSITS MADE',
   *    'CHARGES',
   *    'STATEMENT' ],
   *  [ '66.08', '2', '50.48', '1', '26.00', '.00', '41.60' ],
   */
  const location = _.findIndex(statementArr, line => {
    return line[2] === 'OF DEBITS PAID' && line[4] === 'OF DEPOSITS MADE';
  }) + 1;

  const totalDebits = statementArr[location][2];
  const totalDeposits = statementArr[location][4];

  return {'debits': totalDebits, 'deposits': totalDeposits};
}

function getTransactions(lines) {
  // Deposits
  const depositStart = _.findIndex(lines, line => {
    return line[0] === 'DEPOSITS AND OTHER CREDITS';
  }) + 2;
  // Debits
  const debitStart = _.findIndex(lines, line => {
    return line[0] === 'OTHER DEBITS';
  }) + 2;
  // End
  const transactionEnd = _.findIndex(lines, line => {
    return line[0] === 'ACCOUNT BALANCE SUMMARY';
  });

  const depositLen = debitStart - depositStart - 2;
  const debitLen = transactionEnd - debitStart;

  const deposits = lines.slice(depositStart, depositStart + depositLen)
  const debits = lines.slice(debitStart, debitStart + debitLen)

  // Sort out the deposits
  function sortTransactions(transactions, negative) {
    return transactions.map(line => {
      const rawDate = /^([0-9]{2})\/([0-9]{2})/.exec(line[0])
      if (!rawDate) return null;

      const date = {
        'month': rawDate[1],
        'day': rawDate[2]
      }


      const rawTransaction = /([0-9]*\.[0-9]*) ([a-zA-Z0-9 ]*)/.exec(line[1] + ' ' + line[2]);
      const transaction = {
        'amount': rawTransaction[1],
        'info': rawTransaction[2]
      }

      if (negative) {
        transaction.amount = '-' + transaction.amount;
      }

      return {date, transaction};
    });
  }

  const sortedDeposits = _.compact(sortTransactions(deposits));
  const sortedDebits = _.compact(sortTransactions(debits, true));


  return ({'deposits': sortedDeposits, 'debits': sortedDebits});
}

function writeQIF(data, qif) {
 /*
  * !Account
  * NUSAA Checking
  * TBank
  * ^
  * !Type:Bank
  * D07/14/2010
  * T50.00
  * CR
  * P
  * M(null)
  * L
  * ^
  */
  let out = "";

  let transactions = data.transactions;
  let statementDate = data.statementDate;
  let statementMonth = statementDate.month;

  function generate(trans) {
    // {"date":{"month":"12","day":"31"},"transaction":{"amount":"26.00","info":"ACH CREDIT 123110"}}
    let year = "20" + statementDate.year;
    if (statementMonth === '01' && trans.date.month === '12') {
      // Fixes the year for transactions in DEC for JAN statement.
      year = (parseInt(year) - 1).toString();
    }

    const date = 'D' + trans.date.month + '/' + trans.date.day + '/' + year;
    const amount = 'T' + trans.transaction.amount;
    const cr = 'CR';
    const payee = 'P';
    const memo = 'M' + trans.transaction.info;
    const l = 'L';

    const transStr = date + '\n' + amount + '\n' + cr + '\n' + payee + '\n' + memo + '\n' + l + '\n^\n';
    out = out + transStr;
  }

  transactions.debits.forEach(generate);
  transactions.deposits.forEach(generate);

  return out;
}


function pdf(pdf_paths, index, qif) {
  pdfUtil.pdfToText(pdf_paths[index], option, function(err, data) {
    if (err) throw(err);

    let lines = data.split('\n')
                    .map(line => {
                      return line.trim()
                    })
                    .filter(Boolean)
                    .map(line => {
                      return line.split('  ')
                        .filter(Boolean)
                        .map(item => {return item.trim()})
                    });

    // Find the statement year
    const statementDate = getStatementDate(lines);

    // Get totals
    const totals = getTotals(lines);

    // Get Deposits and Debits
    const transactions = getTransactions(lines);

    const tdata = {statementDate, totals, transactions};

    qif = writeQIF(tdata);

    if (pdf_paths.length > ++index) {
      pdf(pdf_paths, index, qif);
    }
    else {
      qif = "!Account\nNUSAA Checking\nTBank\n^\n!Type:Bank\n" + qif;
      fs.writeFile('data.qif', qif, function (err) {
        if (err) {
          console.log(err);
        }
      })
    }
  });
}

let qif = "";
let index = 0;

pdf(pdf_paths, index, qif);


