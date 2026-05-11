import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Font, 
  Image 
} from '@react-pdf/renderer';

// Note: Arabic reshaping is not natively supported by react-pdf.
// This layout focuses on professional structure and bilingual text placement.
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/inter/Inter-Regular.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/inter/Inter-Medium.ttf', fontWeight: 500 },
    { src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/inter/Inter-Bold.ttf', fontWeight: 700 },
  ],
});

const PRIMARY_COLOR = '#2563EB';
const SECONDARY_COLOR = '#4B5563';
const BORDER_COLOR = '#E5E7EB';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    alignItems: 'flex-start',
  },
  logoContainer: {
    width: '40%',
  },
  logoImage: {
    width: 100,
    height: 50,
    objectFit: 'contain',
    marginBottom: 10,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    marginBottom: 10,
  },
  companyDetails: {
    width: '50%',
    textAlign: 'right',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  companyArabic: {
    fontSize: 11,
    color: SECONDARY_COLOR,
    marginBottom: 8,
  },
  headerLabel: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: -1,
  },
  badge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
  },
  infoSection: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 40,
  },
  card: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  cardTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    color: 'white',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colAmount: { flex: 1.5, textAlign: 'right' },
  financials: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalContainer: {
    width: '45%',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
  footer: {
    marginTop: 'auto',
    textAlign: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  thankYou: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  paymentNotes: {
    fontSize: 8,
    color: SECONDARY_COLOR,
    marginTop: 5,
  },
  statusWatermark: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    fontSize: 100,
    opacity: 0.05,
    fontWeight: 'bold',
    transform: 'rotate(-45deg)',
  }
});

export const InvoicePDF = ({ invoice, company }: any) => {
  const statusColors: any = {
    paid: '#16A34A',
    unpaid: '#DC2626',
    draft: '#6B7280',
    overdue: '#991B1B'
  };

  return (
    <Document title={`Invoice ${invoice.invoice_number}`}>
      <Page size="A4" style={styles.page}>
        <Text style={[styles.statusWatermark, { color: statusColors[invoice.status] }]}>
          {invoice.status.toUpperCase()}
        </Text>

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {company.logo_url ? (
              <Image src={company.logo_url} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder} />
            )}
            <Text style={styles.headerLabel}>INVOICE</Text>
            <View style={[styles.badge, { backgroundColor: statusColors[invoice.status] || '#6B7280' }]}>
              <Text style={{ color: 'white' }}>{invoice.status}</Text>
            </View>
          </View>
          <View style={styles.companyDetails}>
            <Text style={styles.companyName}>{company.name_en}</Text>
            {company.name_ar && <Text style={styles.companyArabic}>{company.name_ar}</Text>}
            <Text style={{ color: SECONDARY_COLOR }}>{company.address}</Text>
            <Text style={{ color: SECONDARY_COLOR }}>{company.address_ar}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bill To</Text>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#111827' }}>{invoice.customer.name_en}</Text>
            {invoice.customer.name_ar && <Text style={{ fontSize: 10, color: SECONDARY_COLOR, marginBottom: 4 }}>{invoice.customer.name_ar}</Text>}
            <Text style={{ color: SECONDARY_COLOR }}>{invoice.customer.email}</Text>
            <Text style={{ color: SECONDARY_COLOR }}>{invoice.customer.phone}</Text>
            {invoice.customer.address && <Text style={{ color: SECONDARY_COLOR }}>{invoice.customer.address}</Text>}
            {invoice.customer.address_ar && <Text style={{ color: SECONDARY_COLOR }}>{invoice.customer.address_ar}</Text>}
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Invoice Details</Text>
            <View style={{ gap: 4 }}>
              <Text><Text style={{ fontWeight: 'bold' }}>Number: </Text>#{invoice.invoice_number}</Text>
              <Text><Text style={{ fontWeight: 'bold' }}>Issue Date: </Text>{new Date(invoice.issue_date).toLocaleDateString()}</Text>
              <Text><Text style={{ fontWeight: 'bold' }}>Due Date: </Text>{new Date(invoice.due_date).toLocaleDateString()}</Text>
              <Text><Text style={{ fontWeight: 'bold' }}>Currency: </Text>{invoice.currency || company?.default_currency}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>ITEM DESCRIPTION</Text>
            <Text style={styles.colQty}>QTY</Text>
            <Text style={styles.colPrice}>RATE</Text>
            <Text style={styles.colAmount}>AMOUNT</Text>
          </View>
          {invoice.invoice_items.map((item: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{item.unit_price.toLocaleString()}</Text>
              <Text style={[styles.colAmount, { fontWeight: 'bold' }]}>{item.amount.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.financials}>
          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={{ color: SECONDARY_COLOR }}>Subtotal</Text>
              <Text style={{ fontWeight: 500 }}>{invoice.subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={{ color: SECONDARY_COLOR }}>VAT ({company.tax_rate}%)</Text>
              <Text style={{ fontWeight: 500 }}>{invoice.tax_amount.toLocaleString()}</Text>
            </View>
            <View style={styles.grandTotal}>
              <Text style={styles.grandTotalLabel}>TOTAL DUE</Text>
              <Text style={styles.grandTotalValue}>{invoice.currency} {invoice.total_amount.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {invoice.notes && (
          <View style={{ marginTop: 40, padding: 15, borderLeftWidth: 3, borderLeftColor: PRIMARY_COLOR, backgroundColor: '#F9FAFB' }}>
            <Text style={[styles.cardTitle, { marginBottom: 5 }]}>Notes</Text>
            <Text style={{ fontSize: 9, color: SECONDARY_COLOR }}>{invoice.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.thankYou}>Thank you for your business!</Text>
          <Text style={styles.paymentNotes}>
            Please settle this invoice within the due date. For wire transfers, use the invoice number as reference.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
