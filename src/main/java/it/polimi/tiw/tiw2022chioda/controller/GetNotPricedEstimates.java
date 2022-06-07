package it.polimi.tiw.tiw2022chioda.controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import it.polimi.tiw.tiw2022chioda.bean.Option;
import it.polimi.tiw.tiw2022chioda.bean.Product;
import it.polimi.tiw.tiw2022chioda.dao.OptionDAO;
import it.polimi.tiw.tiw2022chioda.dao.ProductDAO;
import it.polimi.tiw.tiw2022chioda.utils.ConnectionHandler;
import it.polimi.tiw.tiw2022chioda.utils.ErrorSender;

import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import java.io.IOException;
import java.io.Serial;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet(name = "GetNotPricedEstimates", value = "/GetNotPricedEstimates")
@MultipartConfig
public class GetNotPricedEstimates extends HttpServlet {

    @Serial
    private static final long serialVersionUID = 1L;
    private Connection connection = null;
    private Gson gson;

    public void init() throws ServletException {
        System.out.println("CheckLogin initialization");
        connection = ConnectionHandler.getConnection(getServletContext());
        gson = new GsonBuilder().setPrettyPrinting().create();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        ErrorSender.wrongHttp(response, "Post");
    }

}
