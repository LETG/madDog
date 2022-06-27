package fr.indigeo.wps.dataimport;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.apache.log4j.Logger;
import org.junit.Test;

public class TestMaddogDataImporter {

	private static final Logger LOGGER = Logger.getLogger(TestMaddogDataImporter.class);

	@Test
	public void testAllServices() throws IOException {

		InputStream input = MaddogDataImporter.class.getClassLoader().getResourceAsStream("data.csv");
		byte[] csvContentBytes = input.readAllBytes();
		String csvContent = new String(csvContentBytes, StandardCharsets.UTF_8);
		LOGGER.debug("File Content : " + csvContent);
		MaddogDataImporter.importData("PIERRE", "MNT", 0, "20170101", "2154", "equipement", "operator", csvContent );
	}
}
