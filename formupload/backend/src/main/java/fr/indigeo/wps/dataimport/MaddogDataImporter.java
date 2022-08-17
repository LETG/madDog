package fr.indigeo.wps.dataimport;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.regex.Pattern;

import org.apache.log4j.Logger;
import org.geoserver.wps.gs.GeoServerProcess;
import org.geotools.process.factory.DescribeParameter;
import org.geotools.process.factory.DescribeProcess;
import org.geotools.process.factory.DescribeResult;
import org.geotools.process.factory.StaticMethodsProcessFactory;
import org.geotools.text.Text;

import com.opencsv.CSVWriter;

import net.sf.json.JSONObject;

/**
 * @author Pierre Jego https://jdev.fr
 *
 */
@DescribeProcess(title = "Add data to maddog datadir", description = "Import data to maddog folder")
public class MaddogDataImporter extends StaticMethodsProcessFactory<MaddogDataImporter> implements GeoServerProcess {

	private static final Logger LOGGER = Logger.getLogger(MaddogDataImporter.class);

    private static final String DATA_FOLDER = "/data/MADDOG/";
    private static final String DATE_PATTERN="yyyyMMddHHmmssSSSSSSS"; 
    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat(DATE_PATTERN);

	public MaddogDataImporter() {
		super(Text.text("Import Maddog data"), "imp", MaddogDataImporter.class);
	}


	@DescribeProcess(title = "Add Maddog data", description = "Add maddog data from given items")
	@DescribeResult(name = "resultFeatureCollection", description = "the result of drawing radials in reference Line")
	public static String importData(
		@DescribeParameter(name = "codeSite", description = "codeSite") final String codeSite,
		@DescribeParameter(name = "measureType", description = "Type of data, TDC, PRF, MNT") final String measureType,
        @DescribeParameter(name = "numProfil", description = "Profil number (between 1 and 9", min = 0) Integer numProfil,
        @DescribeParameter(name = "surveyDate", description = "Survey Date ") final String surveyDate,
        @DescribeParameter(name = "epsg", description = "Projection 2154 without EPSG: ") final String epsg,
        @DescribeParameter(name = "idEquipement", description = "Equipement Code") final String idEquipement,
        @DescribeParameter(name = "idOperator", description = "Operator information") final String idOperator,
        @DescribeParameter(name = "csvContent", description = "Data content of the csv file") final String csvContent) {

            boolean isSuccess = false;

            if (LOGGER.isDebugEnabled()){
                LOGGER.debug("codeSite : " + codeSite);
                LOGGER.debug("measureType : " + measureType);
                LOGGER.debug("numProfil : " +  numProfil);
                LOGGER.debug("surveyDate : " +  surveyDate);
                LOGGER.debug("epsg : " + epsg);
                LOGGER.debug("idEquipement : " + idEquipement);
                LOGGER.debug("idOperator : " + idOperator);
                LOGGER.debug("csvContent : " + csvContent); 
            }
            
            if(codeSite.matches("^[A-Z]{6}") && measureType.matches("^[A-Z]{3}") && surveyDate.matches("^[0-9]{4}-[0-9]{2}-[0-9]{2}") && epsg.matches("^[0-9]{4}")){
                 
                StringBuffer finalDataType = new StringBuffer(measureType);
                if(numProfil == null || numProfil<1 || numProfil >9){
                    numProfil=1;
                    LOGGER.debug("numProfil update to: " +  numProfil);
                }
                finalDataType.append(numProfil);
            
                Path folderPath = createMaddogFolder(codeSite, finalDataType.toString());
                
                if (folderPath != null){
                    try {
                        createMetaDataFile(folderPath, codeSite, measureType, numProfil, surveyDate, epsg, idEquipement, idOperator);

                        StringBuffer dataFileName = createFileBaseName(folderPath.toString(), measureType, numProfil, codeSite, surveyDate);
                        dataFileName.append(".csv");

                        uploadCSVContent(dataFileName.toString(), csvContent);
                        isSuccess = true;
                    } catch (IOException e) {
                        LOGGER.error("Erreur while writing csv file" + e.getMessage());
                    }  
                }else{
                    LOGGER.warn("Error while creating folder");
                }
            }else{
                LOGGER.warn("Error in input parameters");
            }
            JSONObject result = new JSONObject();
            result.put("succes", isSuccess);
            
	    return result.toString();
	}

    private static void uploadCSVContent(String fileName, String csvContent) throws IOException {      

        LOGGER.info("Data filename : " + fileName.toString()); 
        
        BufferedWriter writer = new BufferedWriter(new FileWriter(fileName));
        writer.write(csvContent);
        writer.close();
    }


    /**
     * 
     * @param folderPath
     * @param codeSite
     * @param measureType
     * @param numProfil
     * @param surveyDate
     * @param epsg
     * @param idEquipement
     * @param idOperator
     * @throws IOException
     */
    private static void createMetaDataFile(Path folderPath, String codeSite, String measureType, Integer numProfil, String surveyDate, String epsg, String idEquipement, String idOperator ) throws IOException {

        StringBuffer metaFileName = createFileBaseName(folderPath.toString(), measureType, numProfil, codeSite, surveyDate);
        metaFileName.append(".meta");

        LOGGER.info("Meta filename : " + metaFileName.toString()); 

        File csvOutputFile = new File(metaFileName.toString());
        FileWriter outputfile = new FileWriter(csvOutputFile);
        
        CSVWriter metaDataCSV = new CSVWriter(outputfile, ';', CSVWriter.NO_QUOTE_CHARACTER, CSVWriter.DEFAULT_ESCAPE_CHARACTER, CSVWriter.DEFAULT_LINE_END);
        
        // adding header to csv
        final String[] header = { "code_site", "type_measure", "num_profil","date_survey","epsg","id_equipment","id_operator" };
        metaDataCSV.writeNext(header);
    
        // add data to csv
        String[] meta = { codeSite, measureType, Integer.toString(numProfil), surveyDate, epsg, idEquipement, idOperator};
        if (LOGGER.isDebugEnabled()){
            LOGGER.debug("data to add : " + Arrays.toString(meta)); 
        }
        metaDataCSV.writeNext(meta);
        metaDataCSV.close();

        csvOutputFile.createNewFile();
    }


    private static StringBuffer createFileBaseName(String folderStringPath, String measureType, Integer numProfil, String codeSite, String surveyDate) {
                
        StringBuffer FileBaseName = new StringBuffer(folderStringPath);
        FileBaseName.append(File.separator);
        FileBaseName.append(measureType);
        FileBaseName.append(numProfil);
        FileBaseName.append("_");
        FileBaseName.append(codeSite);
        FileBaseName.append("_");
        FileBaseName.append(surveyDate);

        return FileBaseName;
    }


    /**
     * 
     * @param codeSite
     * @param dataType
     * @return
     */
    public static Path  createMaddogFolder(String codeSite, String dataType){

        Path folderPath = null;
        // check or create site folder
        try {
            
            Path pathSite = Paths.get(DATA_FOLDER, codeSite);
                
            LOGGER.debug("Check folder and create : " + pathSite.toString());
            Files.createDirectories(pathSite);  

            Path pathDataType = Paths.get(pathSite.toString(), dataType);
            LOGGER.debug("Check folder and create : " + pathDataType.toString());
            Files.createDirectories(pathDataType);  

            Path pathDate = Paths.get(pathDataType.toString(), DATE_FORMAT.format(new Date()));
            LOGGER.info("Check folder and create : " + pathDate.toString());
            folderPath = Files.createDirectories(pathDate);  

        } catch (FileAlreadyExistsException e) {
            LOGGER.info("No need to create folder exist" + e.getMessage());
        } catch (NoSuchFileException e) {
            LOGGER.error("Parent directory does not exist!" + e.getMessage());
        } catch (IOException e) {
            LOGGER.error("Parent directory does not exist!" + e.getMessage());
        }
        return folderPath;
    }

}
