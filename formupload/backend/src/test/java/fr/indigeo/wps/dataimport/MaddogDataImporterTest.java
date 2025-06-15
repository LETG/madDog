package fr.indigeo.wps.dataimport;


import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

import java.io.IOException;
import java.lang.reflect.Field;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;

import org.json.simple.JSONObject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.io.TempDir;

public class MaddogDataImporterTest {

    @TempDir
    Path tempDir;

    @BeforeEach
    public void setUp() throws Exception {
        // Override the DATA_FOLDER for tests
        Field dataFolderField = MaddogDataImporter.class.getDeclaredField("DATA_FOLDER");
        dataFolderField.setAccessible(true);
        dataFolderField.set(null, tempDir.toString() + "/");
    }

    @Test
    public void testImportDataSuccess() {
        String codeSite = "ABCDEFG".substring(0,6); // "ABCDEF"
        String measureType = "TDC";
        Integer numProfil = 1;
        String surveyDate = "2024-06-15";
        String epsg = "2154";
        String idEquipement = "EQ01";
        String idOperator = "OP01";
        String csvContent = "x;y;z\n1;2;3";

        String result = MaddogDataImporter.importData(
                codeSite, measureType, numProfil, surveyDate, epsg, idEquipement, idOperator, csvContent);

        assertNotNull(result);
        JSONObject json = (JSONObject) org.json.simple.JSONValue.parse(result);
        assertTrue((Boolean) json.get("succes"));

        // Check that files are created
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(tempDir.resolve(codeSite))) {
            boolean foundCsv = false, foundMeta = false;
            for (Path folder : stream) {
                try (DirectoryStream<Path> files = Files.newDirectoryStream(folder)) {
                    for (Path file : files) {
                        if (file.toString().endsWith(".csv")) foundCsv = true;
                        if (file.toString().endsWith(".meta")) foundMeta = true;
                    }
                }
            }
            assertTrue(foundCsv, "CSV file should be created");
            assertTrue(foundMeta, "Meta file should be created");
        } catch (IOException e) {
            fail("Exception while checking files: " + e.getMessage());
        }
    }

    @Test
    public void testImportDataInvalidParameters() {
        // Invalid codeSite (not 6 uppercase letters)
        String result = MaddogDataImporter.importData(
                "BAD", "TDC", 1, "2024-06-15", "2154", "EQ01", "OP01", "x;y;z\n1;2;3");
        JSONObject json = (JSONObject) org.json.simple.JSONValue.parse(result);
        assertTrue((Boolean) json.get("succes"));
    }

    @Test
    public void testImportDataNullNumProfil() {
        String codeSite = "ABCDEF";
        String measureType = "TDC";
        Integer numProfil = null;
        String surveyDate = "2024-06-15";
        String epsg = "2154";
        String idEquipement = "EQ01";
        String idOperator = "OP01";
        String csvContent = "x;y;z\n1;2;3";

        String result = MaddogDataImporter.importData(
                codeSite, measureType, numProfil, surveyDate, epsg, idEquipement, idOperator, csvContent);

        assertNotNull(result);
        JSONObject json = (JSONObject) org.json.simple.JSONValue.parse(result);
        assertTrue((Boolean) json.get("succes"));
    }

    @Test
    public void testCreateMaddogFolder() {
        String codeSite = "ABCDEF";
        String dataType = "TDC1";
        Path folder = MaddogDataImporter.createMaddogFolder(codeSite, dataType);
        assertNotNull(folder);
        assertTrue(Files.exists(folder));
    }

    @Test
    public void testCreateFileBaseName() {
        String folder = "/tmp/test";
        String measureType = "TDC";
        Integer numProfil = 1;
        String codeSite = "ABCDEF";
        String surveyDate = "20240615";
        StringBuffer baseName = MaddogDataImporter.createFileBaseName(folder, measureType, numProfil, codeSite, surveyDate);
        assertTrue(baseName.toString().contains(folder));
        assertTrue(baseName.toString().contains(measureType));
        assertTrue(baseName.toString().contains(codeSite));
        assertTrue(baseName.toString().contains(surveyDate));
    }
}