import ReactPDF, {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

export interface SaleItem {
  srNo: number;
  name: string;
  qty: string;
  price: string;
  tax: string;
  amount: string;
}

export interface InvoiceData {
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyContact: string;
  pharmacyGSTIN: string;
  pharmacyPAN: string;
  billTo: {
    name?: string;
    phone?: string;
    email?: string;
  };
  invoiceNo: string;
  invoiceDate: string;
  items: SaleItem[];
  discount?: number;
  totalQty: number;
  totalAmount: number;
  receivedAmount: number;
  dueBalance: number;
  notes: string[];
  terms: string[];
}

const FIRST_PAGE_ROWS = 15;
const SUBSEQUENT_PAGE_ROWS = 25;

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: "Helvetica",
  },

  headerContainer: {
    border: "1px solid #000",
    padding: 12,
    marginBottom: 0,
  },

  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00d084",
    textAlign: "center",
    marginBottom: 6,
  },

  headerAddress: {
    fontSize: 9,
    textAlign: "center",
    marginBottom: 8,
  },

  headerDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
  },

  boldText: {
    fontWeight: "bold",
    fontSize: 8,
  },

  normalText: {
    fontSize: 8,
  },

  billToContainer: {
    flexDirection: "row",
    borderLeft: "1px solid #000",
    borderRight: "1px solid #000",
    borderBottom: "1px solid #000",
  },

  billToLeft: {
    width: "60%",
    padding: 10,
    borderRight: "1px solid #000",
  },

  billToRight: {
    width: "40%",
    padding: 10,
  },

  sectionTitle: {
    fontWeight: "bold",
    fontSize: 9,
    marginBottom: 6,
  },

  detailText: {
    fontSize: 8,
    marginBottom: 2,
  },

  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  invoiceLabel: {
    fontWeight: "bold",
    fontSize: 9,
  },

  table: {
    border: "1px solid #000",
    borderTop: 0,
  },

  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#00d084",
    borderBottom: "1px solid #000",
  },

  tableHeaderCell: {
    padding: 6,
    fontWeight: "bold",
    fontSize: 8,
    borderRight: "1px solid #000",
    textAlign: "center",
  },

  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #ddd",
    minHeight: 25,
  },

  tableRowNoBorder: {
    flexDirection: "row",
    minHeight: 25,
  },

  tableCell: {
    padding: 6,
    fontSize: 8,
    borderRight: "1px solid #ddd",
    justifyContent: "center",
  },

  colSrNo: { width: "8%" },
  colItems: { width: "30%" },
  colQty: { width: "15%" },
  colPrice: { width: "15%" },
  colTax: { width: "15%" },
  colAmount: { width: "17%", borderRight: 0 },

  summaryRow: {
    flexDirection: "row",
    borderTop: "1px solid #000",
    borderBottom: "1px solid #ddd",
    borderLeft: "1px solid #000",
    borderRight: "1px solid #000",
  },

  summaryLabel: {
    width: "68%",
    padding: 6,
    fontSize: 9,
    textAlign: "right",
    fontWeight: "bold",
    borderRight: "1px solid #ddd",
  },

  summaryEmpty: {
    width: "15%",
    borderRight: "1px solid #ddd",
  },

  summaryValue: {
    width: "17%",
    padding: 6,
    fontSize: 9,
    textAlign: "right",
  },

  totalRow: {
    flexDirection: "row",
    backgroundColor: "#00d084",
    borderLeft: "1px solid #000",
    borderRight: "1px solid #000",
    borderBottom: "1px solid #000",
  },

  totalLabel: {
    width: "68%",
    padding: 6,
    fontSize: 10,
    textAlign: "right",
    fontWeight: "bold",
    borderRight: "1px solid #000",
  },

  totalQty: {
    width: "15%",
    padding: 6,
    fontSize: 9,
    textAlign: "center",
    fontWeight: "bold",
    borderRight: "1px solid #000",
  },

  totalAmount: {
    width: "17%",
    padding: 6,
    fontSize: 10,
    textAlign: "right",
    fontWeight: "bold",
  },

  paymentRow: {
    flexDirection: "row",
    borderLeft: "1px solid #000",
    borderRight: "1px solid #000",
    borderBottom: "1px solid #000",
  },

  paymentLabel: {
    width: "83%",
    padding: 6,
    fontSize: 9,
    textAlign: "right",
    borderRight: "1px solid #ddd",
  },

  paymentValue: {
    width: "17%",
    padding: 6,
    fontSize: 9,
    textAlign: "right",
  },

  footerContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 10,
  },

  footerBox: {
    width: "48%",
    border: "1px solid #000",
    padding: 10,
    minHeight: 70,
  },

  footerTitle: {
    fontWeight: "bold",
    fontSize: 9,
    marginBottom: 6,
  },

  footerText: {
    fontSize: 8,
    marginBottom: 2,
  },

  signature: {
    position: "absolute",
    bottom: 100,
    right: 40,
    textAlign: "right",
    fontSize: 9,
  },

  continuationTable: {
    border: "1px solid #000",
  },
});

const TableRow = ({
  item,
  showBorder = true,
}: {
  item: SaleItem | null;
  showBorder?: boolean;
}) => (
  <View style={showBorder ? styles.tableRow : styles.tableRowNoBorder}>
    <Text style={[styles.tableCell, styles.colSrNo]}>{item?.srNo || " "}</Text>
    <Text style={[styles.tableCell, styles.colItems]}>{item?.name || " "}</Text>
    <Text style={[styles.tableCell, styles.colQty]}>{item?.qty || " "}</Text>
    <Text style={[styles.tableCell, styles.colPrice]}>
      {item ? `Rs. ${item.price}` : " "}
    </Text>
    <Text style={[styles.tableCell, styles.colTax]}>
      {item ? `Rs. ${item.tax}` : " "}
    </Text>
    <Text style={[styles.tableCell, styles.colAmount]}>
      {item ? `Rs. ${item.amount}` : " "}
    </Text>
  </View>
);

const TableHeader = () => (
  <View style={styles.tableHeaderRow}>
    <Text style={[styles.tableHeaderCell, styles.colSrNo]}>Sr. No</Text>
    <Text style={[styles.tableHeaderCell, styles.colItems]}>Items</Text>
    <Text style={[styles.tableHeaderCell, styles.colQty]}>Quantity</Text>
    <Text style={[styles.tableHeaderCell, styles.colPrice]}>Price / Unit</Text>
    <Text style={[styles.tableHeaderCell, styles.colTax]}>Tax / Unit</Text>
    <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
  </View>
);

const FirstPage = ({
  data,
  items,
}: {
  data: InvoiceData;
  items: SaleItem[];
}) => {
  const emptyRows = FIRST_PAGE_ROWS - items.length;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <Text style={styles.companyName}>{data.pharmacyName}</Text>
        <Text style={styles.headerAddress}>{data.pharmacyAddress}</Text>
        <View style={styles.headerDetailsRow}>
          <Text>
            <Text style={styles.boldText}>Phone: </Text>
            <Text style={styles.normalText}>{data.pharmacyContact}</Text>
          </Text>
          <Text>
            <Text style={styles.boldText}>GSTIN: </Text>
            <Text style={styles.normalText}>{data.pharmacyGSTIN}</Text>
          </Text>
          <Text>
            <Text style={styles.boldText}>PAN Number: </Text>
            <Text style={styles.normalText}>{data.pharmacyPAN}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.billToContainer}>
        <View style={styles.billToLeft}>
          <Text style={styles.sectionTitle}>BILL TO</Text>
          <Text style={styles.detailText}>{data.billTo.name}</Text>
          <Text style={styles.detailText}>Phone: {data.billTo.phone}</Text>
          <Text style={styles.detailText}>Email: {data.billTo.email}</Text>
        </View>

        <View style={styles.billToRight}>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Invoice No</Text>
            <Text style={styles.detailText}>{data.invoiceNo}</Text>
          </View>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Invoice Date</Text>
            <Text style={styles.detailText}>{data.invoiceDate}</Text>
          </View>
        </View>
      </View>

      <View style={styles.table}>
        <TableHeader />

        {items.map((item, index) => (
          <TableRow
            key={item.srNo}
            item={item}
            showBorder={index < items.length - 1 || emptyRows > 0}
          />
        ))}

        {Array.from({ length: emptyRows }).map((_, i) => (
          <TableRow
            key={`empty-${i}`}
            item={null}
            showBorder={i < emptyRows - 1}
          />
        ))}

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Discount</Text>
          <Text style={styles.summaryEmpty}></Text>
          <Text style={styles.summaryValue}>{data.discount}%</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalQty}>{data.totalQty}</Text>
          <Text style={styles.totalAmount}>Rs. {data.totalAmount}</Text>
        </View>
      </View>

      <View style={styles.paymentRow}>
        <Text style={styles.paymentLabel}>Received Amount</Text>
        <Text style={styles.paymentValue}>Rs. {data.receivedAmount}</Text>
      </View>

      <View style={styles.paymentRow}>
        <Text style={styles.paymentLabel}>Due Balance</Text>
        <Text style={styles.paymentValue}>Rs. {data.dueBalance}</Text>
      </View>

      <View style={styles.footerContainer}>
        <View style={styles.footerBox}>
          <Text style={styles.footerTitle}>Notes</Text>
          {data.notes.map((note, i) => (
            <Text key={i} style={styles.footerText}>
              {i + 1}. {note}
            </Text>
          ))}
        </View>

        <View style={styles.footerBox}>
          <Text style={styles.footerTitle}>Terms & Conditions</Text>
          {data.terms.map((term, i) => (
            <Text key={i} style={styles.footerText}>
              {i + 1}. {term}
            </Text>
          ))}
        </View>
      </View>

      <Text style={styles.signature}>
        Authorised Signatory For{"\n"}
        {data.pharmacyName}
      </Text>
    </Page>
  );
};

const ContinuationPage = ({ items }: { items: SaleItem[] }) => {
  const emptyRows = SUBSEQUENT_PAGE_ROWS - items.length;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.continuationTable}>
        <TableHeader />

        {items.map((item, index) => (
          <TableRow
            key={item.srNo}
            item={item}
            showBorder={index < items.length - 1 || emptyRows > 0}
          />
        ))}

        {Array.from({ length: emptyRows }).map((_, i) => (
          <TableRow
            key={`empty-${i}`}
            item={null}
            showBorder={i < emptyRows - 1}
          />
        ))}
      </View>
    </Page>
  );
};

export const InvoicePDF = ({ data }: { data: InvoiceData }) => {
  const { items } = data;

  const firstPageItems = items.slice(0, FIRST_PAGE_ROWS);
  const remainingItems = items.slice(FIRST_PAGE_ROWS);

  const subsequentPages: SaleItem[][] = [];
  for (let i = 0; i < remainingItems.length; i += SUBSEQUENT_PAGE_ROWS) {
    subsequentPages.push(remainingItems.slice(i, i + SUBSEQUENT_PAGE_ROWS));
  }

  return (
    <Document>
      <FirstPage data={data} items={firstPageItems} />

      {subsequentPages.map((pageItems, index) => (
        <ContinuationPage key={index} items={pageItems} />
      ))}
    </Document>
  );
};

export const generatePDF = async (data: InvoiceData) => {
  const pdf = await ReactPDF.renderToStream(<InvoicePDF data={data} />);
  return pdf;
};
