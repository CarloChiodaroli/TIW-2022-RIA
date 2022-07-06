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

@WebServlet(name = "GetProductsAndOptions", value = "/GetProductsAndOptions")
@MultipartConfig
public class GetProductsAndOptions extends HttpServlet {

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
        ProductDAO productDAO = new ProductDAO(connection);
        OptionDAO optionDAO = new OptionDAO(connection);

        List<Product> products = new ArrayList<>();

        try {
            products = productDAO.getAll();
        } catch (SQLException e) {
            ErrorSender.database(response, "getting products");
            return;
        }

        List<Option> options = new ArrayList<>();

        try {
            options = optionDAO.getAll();
        } catch (SQLException e) {
            ErrorSender.database(response, "getting options");
            return;
        }

        Map<Integer, List<Integer>> availability = new HashMap<>();

        for(Product product: products){
            int code  = product.getCode();
            try {
                availability.put(code, optionDAO.codesFromProduct(code));
            } catch (SQLException e) {
                ErrorSender.database(response, "getting product's options");
            }
        }

        ToSend toSend = new ToSend(products, options, availability);

        String result = gson.toJson(toSend);

        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().println(result);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        ErrorSender.wrongHttp(response, "Post");
    }

    private class ToSend {

        private final List<Product> products;
        private final List<Option> options;
        private final Map<Integer, List<Integer>> availability;

        ToSend(List<Product> products, List<Option> options, Map<Integer, List<Integer>> availability){
            this.availability = availability;
            this.products = products;
            this.options = options;
        }
    }
}
