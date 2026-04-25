/**
 * PDF + Excel dışa aktarım yardımcıları.
 * Kullanılan kütüphaneler (CDN üzerinden index.html'de yüklenir):
 *   - jsPDF (window.jspdf.jsPDF)
 *   - SheetJS / XLSX (window.XLSX)
 */
const Exports = {

  /**
   * Tek bir analizi PDF olarak indirir.
   * @param {object} record - History kayıt formatında nesne
   */
  toPdf(record) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF kütüphanesi yüklenemedi.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    // Başlık
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Kaza Kusur Analiz Raporu', margin, 14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('TRAMER 48 Senaryo - v3', pageWidth - margin, 14, { align: 'right' });

    y = 30;
    doc.setTextColor(0, 0, 0);

    // Senaryo bilgisi
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Senaryo #${record.scenarioId} - ${record.scenarioTitle}`, margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Kategori: ${record.scenarioCategory}`, margin, y);
    y += 8;

    doc.setTextColor(0, 0, 0);
    const descLines = doc.splitTextToSize(record.scenarioDesc || '', pageWidth - 2 * margin);
    doc.setFontSize(10);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 4;

    // Taraflar tablosu
    this._sectionTitle(doc, 'Taraf Bilgileri', y); y += 8;
    const colW = (pageWidth - 2 * margin) / 2;
    this._partyBox(doc, margin, y, colW - 4, 'A Aracı', record.plateA, record.driverA, record.insurerA);
    this._partyBox(doc, margin + colW, y, colW - 4, 'B Aracı', record.plateB, record.driverB, record.insurerB);
    y += 30;

    // Olay bilgileri
    this._sectionTitle(doc, 'Olay Bilgileri', y); y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tarih:      ${this._fmtDate(record.accidentDate)}`, margin, y); y += 6;
    doc.text(`Yer:        ${record.accidentLocation || '-'}`, margin, y); y += 6;
    if (record.notes) {
      doc.text('Notlar:', margin, y); y += 5;
      const notesLines = doc.splitTextToSize(record.notes, pageWidth - 2 * margin - 4);
      doc.text(notesLines, margin + 4, y);
      y += notesLines.length * 5;
    }
    y += 4;

    // Kusur sonucu
    this._sectionTitle(doc, 'Kusur Dağılımı', y); y += 10;
    const boxW = (pageWidth - 2 * margin - 8) / 2;
    this._faultBox(doc, margin, y, boxW, 'A Aracı', record.faultA, [37, 99, 235]);
    this._faultBox(doc, margin + boxW + 8, y, boxW, 'B Aracı', record.faultB, [219, 39, 119]);
    y += 26;

    // Yasal dayanak
    if (record.lawRef) {
      doc.setFillColor(255, 251, 235);
      doc.rect(margin, y, pageWidth - 2 * margin, 12, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9);
      doc.text('Yasal Dayanak:', margin + 3, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(record.lawRef, margin + 3, y + 9);
      y += 16;
    }

    // Footer / disclaimer
    const footerY = doc.internal.pageSize.getHeight() - 18;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const disclaimer = 'Bu rapor TRAMER 48 standart senaryolarına dayalı bir ön değerlendirmedir. ' +
      'Resmi kusur tespiti için sigorta sirketinizin / SBM degerlendirmesi esastir.';
    const dLines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin);
    doc.text(dLines, margin, footerY + 5);
    doc.text(`Olusturma: ${this._fmtDate(record.savedAt)}`, pageWidth - margin, footerY + 5, { align: 'right' });

    const fname = `kaza-analizi-${record.plateA || 'A'}-${record.plateB || 'B'}-${Date.now()}.pdf`
      .replace(/[^a-z0-9.-]/gi, '_');
    doc.save(fname);
  },

  /**
   * Tek bir analizi tek satırlık Excel olarak indirir.
   */
  toXlsxSingle(record) {
    this._toXlsx([record], `kaza-analizi-${Date.now()}.xlsx`);
  },

  /**
   * Tüm geçmişi Excel olarak indirir.
   */
  toXlsxAll(records) {
    if (!records || records.length === 0) {
      alert('Aktarılacak kayıt bulunmuyor.');
      return;
    }
    this._toXlsx(records, `kaza-gecmisi-${Date.now()}.xlsx`);
  },

  // ================= İç yardımcılar =================
  _toXlsx(records, fname) {
    if (!window.XLSX) {
      alert('Excel kütüphanesi yüklenemedi.');
      return;
    }
    const rows = records.map(r => ({
      'Kayıt Tarihi': this._fmtDate(r.savedAt),
      'Senaryo No': r.scenarioId,
      'Senaryo': r.scenarioTitle,
      'Kategori': r.scenarioCategory,
      'A Plaka': r.plateA,
      'A Sürücü': r.driverA,
      'A Sigorta': r.insurerA || '',
      'A Kusur (%)': r.faultA,
      'B Plaka': r.plateB,
      'B Sürücü': r.driverB,
      'B Sigorta': r.insurerB || '',
      'B Kusur (%)': r.faultB,
      'Kaza Tarihi': this._fmtDate(r.accidentDate),
      'Kaza Yeri': r.accidentLocation || '',
      'Yasal Dayanak': r.lawRef || '',
      'Notlar': r.notes || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);

    // Kolon genişlikleri
    ws['!cols'] = [
      { wch: 18 }, { wch: 10 }, { wch: 32 }, { wch: 18 },
      { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 11 },
      { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 11 },
      { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analizler');
    XLSX.writeFile(wb, fname);
  },

  _sectionTitle(doc, text, y) {
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y - 4, doc.internal.pageSize.getWidth() - 30, 7, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(text, 18, y + 1);
    doc.setTextColor(0, 0, 0);
  },

  _partyBox(doc, x, y, w, label, plate, driver, insurer) {
    doc.setDrawColor(226, 232, 240);
    doc.rect(x, y, w, 26);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(label, x + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(`Plaka:   ${plate || '-'}`, x + 3, y + 11);
    doc.text(`Sürücü:  ${driver || '-'}`, x + 3, y + 17);
    doc.text(`Sigorta: ${insurer || '-'}`, x + 3, y + 23);
  },

  _faultBox(doc, x, y, w, label, percent, rgb) {
    doc.setFillColor(...rgb);
    doc.rect(x, y, w, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(label, x + 3, y + 6);
    doc.setFontSize(20);
    doc.text(`%${percent}`, x + w - 3, y + 16, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  },

  _fmtDate(iso) {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString('tr-TR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return iso; }
  },
};

if (typeof window !== 'undefined') window.Exports = Exports;
