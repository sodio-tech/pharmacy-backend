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
  list_price: number;
  tax: string;
  amount: string;
  hsn?: string;
  batchNo?: string;
  batchExpiry?: string;
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
  transaction_id: string;
  invoiceDate: string;
  items: SaleItem[];
  discount?: number;
  totalQty: number;
  totalAmount: number;
}

const FIRST_PAGE_ROWS = 15;
const SUBSEQUENT_PAGE_ROWS = 25;

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: "Helvetica",
  },

  pageNumberContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
  },

  pageNumber: {
    fontSize: 8,
    fontWeight: "bold",
  },

  invoiceBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #000",
    padding: 8,
    marginBottom: 0,
  },

  invoiceText: {
    fontSize: 12,
    textAlign: "center",
    flex: 1,
  },

  originalCopy: {
    fontSize: 9,
    fontWeight: "bold",
  },

  headerContainer: {
    border: "1px solid #000",
    borderTop: 0,
    padding: 12,
    marginBottom: 0,
  },

  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  headerAddress: {
    fontSize: 9,
    textAlign: "center",
    marginBottom: 4,
  },

  headerDetailsRow: {
    textAlign: "center",
    marginBottom: 2,
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
    borderBottom: "1px solid #000",
  },

  tableHeaderCell: {
    padding: 6,
    fontWeight: "bold",
    fontSize: 9,
    borderRight: "1px solid #000",
    textAlign: "center",
  },

  tableRow: {
    flexDirection: "row",
    minHeight: 25,
  },

  tableCell: {
    padding: 6,
    fontSize: 8,
    justifyContent: "center",
    borderRight: "1px solid #000",
  },

  colSrNo: { width: "5%" },
  colItems: { width: "22%" },
  colHSN: { width: "14%" },
  colBatchNo: { width: "14%" },
  colExpiry: { width: "10%" },
  colQty: { width: "5%" },
  colPrice: { width: "10%" },
  colTax: { width: "5%", textAlign: "center" },
  colAmount: { width: "15%", borderRight: 0 },

  totalRow: {
    flexDirection: "row",
    borderTop: "1px solid #000",
    borderBottom: "1px solid #000",
  },

  totalLabel: {
    width: "85%",
    padding: 6,
    fontSize: 10,
    textAlign: "right",
    fontWeight: "bold",
  },

  totalAmount: {
    width: "15%",
    padding: 6,
    fontSize: 10,
    textAlign: "right",
    fontWeight: "bold",
  },

  signatureContainer: {
    position: "absolute",
    bottom: 40,
    right: 40,
    alignItems: "flex-end",
  },

  signatureFor: {
    fontSize: 9,
    marginBottom: 40,
  },

  signatureLine: {
    fontSize: 9,
    fontWeight: "bold",
  },

  continuationTable: {
    border: "1px solid #000",
  },
});

const TableRow = ({ item }: { item: SaleItem | null }) => (
  <View style={styles.tableRow}>
    <Text style={[styles.tableCell, styles.colSrNo]}>{item?.srNo || " "}</Text>
    <Text style={[styles.tableCell, styles.colItems]}>{item?.name || " "}</Text>
    <Text style={[styles.tableCell, styles.colHSN]}>{item?.hsn || " "}</Text>
    <Text style={[styles.tableCell, styles.colBatchNo]}>
      {item?.batchNo || " "}
    </Text>
    <Text style={[styles.tableCell, styles.colExpiry]}>
      {item?.batchExpiry || " "}
    </Text>
    <Text style={[styles.tableCell, styles.colQty]}>{item?.qty || " "}</Text>
    <Text style={[styles.tableCell, styles.colPrice]}>
      {item ? `${item.list_price}` : " "}
    </Text>
    <Text style={[styles.tableCell, styles.colTax]}>
      {item ? `${item.tax}` : " "}
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
    <Text style={[styles.tableHeaderCell, styles.colHSN]}>HSN/SAC</Text>
    <Text style={[styles.tableHeaderCell, styles.colBatchNo]}>Batch No.</Text>
    <Text style={[styles.tableHeaderCell, styles.colExpiry]}>Expiry</Text>
    <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
    <Text style={[styles.tableHeaderCell, styles.colPrice]}>List Price</Text>
    <Text style={[styles.tableHeaderCell, styles.colTax]}>Tax %</Text>
    <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount (Rs.)</Text>
  </View>
);

const FirstPage = ({
  data,
  items,
  pageNumber,
  totalPages,
}: {
  data: InvoiceData;
  items: SaleItem[];
  pageNumber: number;
  totalPages: number;
}) => {
  const emptyRows = FIRST_PAGE_ROWS - items.length;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.invoiceBanner}>
        <Text style={{ width: "20%" }}>
          Page No. {pageNumber} of {totalPages}
        </Text>
        <Text style={styles.invoiceText}>INVOICE</Text>
        <Text
          style={[styles.originalCopy, { width: "20%", textAlign: "right" }]}
        >
          Original Copy
        </Text>
      </View>

      <View style={styles.headerContainer}>
        <Text style={styles.companyName}>{data.pharmacyName}</Text>
        <Text style={styles.headerAddress}>{data.pharmacyAddress}</Text>
        <View style={styles.headerDetailsRow}>
          <Text>Mobile: {data.pharmacyContact}</Text>
        </View>
        <View style={styles.headerDetailsRow}>
          <Text>
            GSTIN - {data.pharmacyGSTIN} | PAN - {data.pharmacyPAN}
          </Text>
        </View>
      </View>

      <View style={styles.billToContainer}>
        <View style={styles.billToLeft}>
          <Text style={styles.sectionTitle}>BILL TO</Text>
          <Text style={styles.detailText}>{data.billTo.name}</Text>
          <Text style={styles.detailText}>Mobile: {data.billTo.phone}</Text>
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
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Transaction ID</Text>
            <Text style={styles.detailText}>{data.transaction_id}</Text>
          </View>
        </View>
      </View>

      <View style={styles.table}>
        <TableHeader />

        {items.map((item) => (
          <TableRow key={item.srNo} item={item} />
        ))}

        {Array.from({ length: emptyRows }).map((_, i) => (
          <TableRow key={`empty-${i}`} item={null} />
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>Rs. {data.totalAmount}</Text>
        </View>
      </View>

      <View style={styles.signatureContainer}>
        <Text style={styles.signatureFor}>For {data.pharmacyName}</Text>
        <Text style={styles.signatureLine}>Signature</Text>
      </View>
    </Page>
  );
};

const ContinuationPage = ({
  items,
  pageNumber,
  totalPages,
}: {
  items: SaleItem[];
  pageNumber: number;
  totalPages: number;
}) => {
  const emptyRows = SUBSEQUENT_PAGE_ROWS - items.length;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.pageNumberContainer}>
        <Text style={styles.pageNumber}>
          Page No. {pageNumber} of {totalPages}
        </Text>
      </View>

      <View style={styles.continuationTable}>
        <TableHeader />

        {items.map((item) => (
          <TableRow key={item.srNo} item={item} />
        ))}

        {Array.from({ length: emptyRows }).map((_, i) => (
          <TableRow key={`empty-${i}`} item={null} />
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

  const totalPages = 1 + subsequentPages.length;

  return (
    <Document>
      <FirstPage
        data={data}
        items={firstPageItems}
        pageNumber={1}
        totalPages={totalPages}
      />

      {subsequentPages.map((pageItems, index) => (
        <ContinuationPage
          key={index}
          items={pageItems}
          pageNumber={index + 2}
          totalPages={totalPages}
        />
      ))}
    </Document>
  );
};

export const generatePDF = async (data: InvoiceData) => {
  const pdf = await ReactPDF.renderToStream(<InvoicePDF data={data} />);
  return pdf;
};
