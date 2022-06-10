package it.polimi.tiw.tiw2022chioda.controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import it.polimi.tiw.tiw2022chioda.bean.Estimate;
import it.polimi.tiw.tiw2022chioda.bean.Option;
import it.polimi.tiw.tiw2022chioda.bean.Product;
import it.polimi.tiw.tiw2022chioda.bean.User;
import it.polimi.tiw.tiw2022chioda.dao.*;
import it.polimi.tiw.tiw2022chioda.enums.UserType;
import it.polimi.tiw.tiw2022chioda.utils.ConnectionHandler;
import it.polimi.tiw.tiw2022chioda.utils.ErrorSender;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.WebContext;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ServletContextTemplateResolver;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.io.Serial;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.*;

@WebServlet(name = "EstimateDetail", value = "/EstimateDetail")
@MultipartConfig
public class EstimateDetail extends HttpServlet {

    @Serial
    private static final long serialVersionUID = 1L;
    private Connection connection = null;
    private Gson gson;

    public void init() throws ServletException {
        connection = ConnectionHandler.getConnection(getServletContext());
        gson = new GsonBuilder().setPrettyPrinting().create();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        HttpSession session = request.getSession();

        EstimateDAO estimateDAO = new EstimateDAO(connection);
        OptionDAO optionDAO = new OptionDAO(connection);
        UserDAO userDAO = new UserDAO(connection);

        User user = (User) session.getAttribute("user");
        String tmpEstCode = request.getParameter("estimateCode");

        if (tmpEstCode == null || tmpEstCode.isEmpty()) {
            ErrorSender.userWrongData(response, "Got no Estimate Code");
            return;
        }
        int estimateCode = 0;
        try{
            estimateCode = Integer.parseInt(tmpEstCode);
        } catch(NumberFormatException e){
            ErrorSender.userWrongData(response, "Estimate code must be an integer");
        }

        Estimate baseEstimate;
        try {
            baseEstimate = estimateDAO.getByCode(estimateCode);
        } catch (SQLException e) {
            ErrorSender.database(response, "getting the estimate");
            return;
        }
        if(baseEstimate == null){
            ErrorSender.userWrongData(response, "There is no estimate with gotten estimate code");
            return;
        }

        List<Integer> optionCodes;
        try {
            optionCodes = optionDAO.codesFromEstimate(estimateCode);
        } catch (SQLException e) {
            ErrorSender.database(response, "getting estimate's options");
            return;
        }

        baseEstimate.setOptionCodes(optionCodes);

        Optional<User> employee;
        User client;
        if(baseEstimate.getClientId() == user.getID()){
            client = user;
            try {
                employee = Optional.ofNullable(userDAO.getById(baseEstimate.getEmployeeId()));
            } catch (SQLException e) {
                ErrorSender.database(response);
                return;
            }
        } else {
            employee = Optional.of(user);
            try {
                client = userDAO.getById(baseEstimate.getClientId());
            } catch (SQLException e) {
                ErrorSender.database(response);
                return;
            }
        }

        Map<String, Object> estimateDetails = new HashMap<>();
        estimateDetails.put("estimate", baseEstimate);
        estimateDetails.put("employee", employee);
        estimateDetails.put("client", client);

        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().println(gson.toJson(estimateDetails));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        ErrorSender.wrongHttp(response, "Post");
    }
}
