/* FUNCTION TO POPULATE THE TABLE ROWS */
exports.tablePopulate = (jsonfile) => {
  // get indexes of the json file
  let idx = Object.keys(jsonfile).slice(0, -4);

  // table column names
  let htmlColumns = '';
  jsonfile['COLUMNS'].splice(0, 1);
  let columns = jsonfile['COLUMNS'];
  columns.forEach((el) => {
    if (el.includes('PRICE ')) {
      el = el.replace('PRICE ', '');
    }
    if (el.includes('DIMENSIONS')) {
      el = el.replace('DIMENSIONS', 'DIM');
    }
    htmlColumns += `<th id="${el.toLowerCase().replace(' ', '-')}">${el}</th>`;
  });

  // Insert json template info into HTML table
  let htmlInner = '';
  idx.forEach((el) => {
    let row = jsonfile[el];
    // LENGTH AND PRICE ENTRIES
    htmlInner += `
    
    <tr id="R${el}" class="tr-standard">
    
    <td>
    <div class="dimensions" id="DR${el}">${row[1]}</div>
 </td>
      
      <td>
      <div id="ER${el}" class="table-entries">${row[2]}</div>
      </td>
      
      <td>
      <div id="USER${el}" class="price-entries-untreated">${row[3]}</div>
      </td>
      
      <td>
      <div id="TSER${el}" class="price-entries-treated" >${row[4]}</div>
      </td>
    </tr>  
    `;
  });

  return { htmlColumns, htmlInner };
};

/* <td>
      <input id="ER${el}" class="table-entries" type="text" value="${row[2]}" disabled/>
      </td>
      
      <td>
      <input id="USER${el}" class="price-entries-untreated" type="number" value="${row[3]}" disabled/>
      </td>
      
      <td>
      <input id="TSER${el}" class="price-entries-treated" type="number" value="${row[4]}" disabled/>
      </td> */
