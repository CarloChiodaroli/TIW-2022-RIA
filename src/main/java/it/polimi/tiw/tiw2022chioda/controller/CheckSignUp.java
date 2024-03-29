package it.polimi.tiw.tiw2022chioda.controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import it.polimi.tiw.tiw2022chioda.bean.User;
import it.polimi.tiw.tiw2022chioda.dao.UserDAO;
import it.polimi.tiw.tiw2022chioda.enums.UserType;
import it.polimi.tiw.tiw2022chioda.utils.ConnectionHandler;
import it.polimi.tiw.tiw2022chioda.utils.ErrorSender;
import org.apache.commons.text.StringEscapeUtils;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.regex.Pattern;

@WebServlet(name = "CheckSignUp", value = "/CheckSignUp")
@MultipartConfig
public class CheckSignUp extends HttpServlet {

    private Connection connection;
    private Gson gson;

    public void init() throws ServletException {
        connection = ConnectionHandler.getConnection(getServletContext());
        gson = new GsonBuilder().create();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        ErrorSender.wrongHttp(response, "Get");
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String username = null;
        String password = null;
        String repeatedPassword = null;
        String userType = null;
        String eMail = null;

        username = StringEscapeUtils.escapeJava(request.getParameter("username"));
        password = StringEscapeUtils.escapeJava(request.getParameter("password"));
        repeatedPassword = StringEscapeUtils.escapeJava(request.getParameter("rep-password"));
        userType = StringEscapeUtils.escapeJava(request.getParameter("usertype"));
        eMail = StringEscapeUtils.escapeJava(request.getParameter("email"));

        //Controls
        if (username == null ||
                password == null ||
                repeatedPassword == null ||
                userType == null ||
                eMail == null ||
                username.isEmpty() ||
                password.isEmpty() ||
                repeatedPassword.isEmpty() ||
                userType.isEmpty() ||
                eMail.isEmpty()) {
            ErrorSender.userWrongData(response, "Credentials must be not empty");
            return;
        }
        if (!password.equals(repeatedPassword)) {
            ErrorSender.userWrongData(response, "Passwords do not coincide");
            return;
        }
        if(!isPassword(password)){
            ErrorSender.userWrongData(response, "Password is not safe");
            return;
        }
        if (!isEMail(eMail)) {
            ErrorSender.userWrongData(response, "Given e-mail is not a valid e-mail address");
            return;
        }
        String userTypeForLambda = userType;
        if(Arrays.stream(UserType.values())
                .map(Enum::toString)
                .noneMatch(x -> x.equals(userTypeForLambda))){
            ErrorSender.userWrongData(response, "Got wrong user type");
            return;
        }

        UserDAO userDAO = new UserDAO(connection);
        try {
            if (userDAO.isUsernamePresent(username)) {
                ErrorSender.userWrongData(response, "Username already used");
                return;
            }
        } catch (SQLException e) {
            ErrorSender.database(response, "checking username duplicates");
            return;
        }
        User user = new User();
        try {
            user.setUserType(userType);
            user.setUsername(username);
            user.setEmail(eMail);
            user = userDAO.registerCredentials(user, password);
        } catch (SQLException e) {
            ErrorSender.database(response);
            return;
        }
        if (user == null) {
            ErrorSender.database(response);
            return;
        }
        request.getSession().setAttribute("user", user);
        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().println(gson.toJson(user));
    }

    private boolean isEMail(String EMail) {
        return Pattern.matches("^[a-zA-Z0-9+_.]+@[a-zA-Z0-9.-]+$", EMail);
    }

    private boolean isPassword(String password) {
        return password.matches("^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z]).{8}.*");
    }
}
