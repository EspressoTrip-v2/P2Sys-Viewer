/* FUNCTION TO POPULATE THE TABLE ROWS */
exports.tablePopulate = (jsonfile) => {
  // get indexes of the json file
  let idx = Object.keys(jsonfile).slice(0, -4);

  // table column names
  let htmlColumns = '';
  jsonfile['COLUMNS'].splice(0, 1);
  let columns = jsonfile['COLUMNS'];
  columns.forEach((el) => {
    htmlColumns += `<th id="${el.toLowerCase().replace(' ', '-')}">${el}</th>`;
  });

  // Insert json template info into HTML table
  let htmlInner = '';
  idx.forEach((el) => {
    let row = jsonfile[el];
    // LENGTH AND PRICE ENTRIES
    htmlInner += `
    
    <tr id="R${el}" ">
      <td class="dimensions" id="DR${el}">${row[1]}</td>
      
      <td>
      <input id="ER${el}" class="table-entries" type="text" value="${row[2]}" disabled/>
      </td>
      
      <td>
      <input id="USER${el}" class="price-entries-untreated" type="number" value="${row[3]}" disabled/>
      </td>
      
      <td>
      <input id="TSER${el}" class="price-entries-treated" type="number" value="${row[4]}" disabled/>
      </td>
    </tr>  
    `;
  });

  return { htmlColumns, htmlInner };
};
