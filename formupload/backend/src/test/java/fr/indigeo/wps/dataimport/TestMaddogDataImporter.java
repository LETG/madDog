package fr.indigeo.wps.dataimport;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;

import org.apache.log4j.Logger;
import org.junit.Test;

public class TestMaddogDataImporter {

	private static final Logger LOGGER = Logger.getLogger(TestMaddogDataImporter.class);


	public void testAllServices() throws IOException {

		InputStream input = MaddogDataImporter.class.getClassLoader().getResourceAsStream("data.csv");
		byte[] csvContentBytes = input.readAllBytes();
		String csvContent = new String(csvContentBytes, StandardCharsets.UTF_8);
		LOGGER.debug("File Content : " + csvContent);
		MaddogDataImporter.importData("PIERRE", "MNT", 0, "2017-01-01", "2154", "equipement", "operator", csvContent );
	}

	@Test
	public void testDate() throws IOException {

		final String DATE_PATTERN="yyyyMMddHHmmssSSSSSSS"; 
    	final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat(DATE_PATTERN);

		DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DATE_PATTERN);

		LOGGER.debug("date : " + LocalDateTime.now().format(formatter));
		LOGGER.debug("date : " + DATE_FORMAT.format(new Date()));
	}
}
