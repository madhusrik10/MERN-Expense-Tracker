// ForgotPasswordPage.js
import { useCallback, useState, useEffect } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { forgotPasswordAPI } from "../../utils/ApiRequest";
import "./auth.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("user")) {
      navigate("/");
    }
  }, [navigate]);

  const [values, setValues] = useState({
    email: "",
  });

  const toastOptions = {
    position: "bottom-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "dark",
  };

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { email } = values;

    // Frontend validation
    if (!email) {
      toast.error("Please enter your email address", toastOptions);
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      toast.error("Please enter a valid email address", toastOptions);
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(forgotPasswordAPI, { email });

      if (data.success === true) {
        toast.success(data.message, toastOptions);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        toast.error(data.message, toastOptions);
        setLoading(false);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to process request. Please try again.";
      toast.error(errorMessage, toastOptions);
      setLoading(false);
    }
  };

  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    // await console.log(container);
  }, []);

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          background: {
            color: {
              value: "#000",
            },
          },
          fpsLimit: 60,
          particles: {
            number: {
              value: 200,
              density: {
                enable: true,
                value_area: 800,
              },
            },
            color: {
              value: "#ffcc00",
            },
            shape: {
              type: "circle",
            },
            opacity: {
              value: 0.5,
              random: true,
            },
            size: {
              value: 3,
              random: { enable: true, minimumValue: 1 },
            },
            links: {
              enable: false,
            },
            move: {
              enable: true,
              speed: 2,
            },
            life: {
              duration: {
                sync: false,
                value: 3,
              },
              count: 0,
              delay: {
                random: {
                  enable: true,
                  minimumValue: 0.5,
                },
                value: 1,
              },
            },
          },
          detectRetina: true,
        }}
        style={{
          position: "absolute",
          zIndex: -1,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      <Container
        className="mt-5"
        style={{ position: "relative", zIndex: "2 !important" }}
      >
        <Row>
          <Col md={{ span: 6, offset: 3 }}>
            <h1 className="text-center mt-5">
              <AccountBalanceWalletIcon
                sx={{ fontSize: 40, color: "white" }}
                className="text-center"
              />
            </h1>
            <h2 className="text-white text-center">Forgot Password</h2>
            <p className="text-white text-center mt-3">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="formBasicEmail" className="mt-3">
                <Form.Label className="text-white">Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  name="email"
                  onChange={handleChange}
                  value={values.email}
                />
              </Form.Group>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
                className="mt-4"
              >
                <Button
                  type="submit"
                  className="text-center mt-3 btnStyle"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>

                <p className="mt-3" style={{ color: "#9d9494" }}>
                  Remember your password?{" "}
                  <Link to="/login" className="text-white lnk">
                    Login
                  </Link>
                </p>
                <p className="mt-2" style={{ color: "#9d9494" }}>
                  Don't have an account?{" "}
                  <Link to="/register" className="text-white lnk">
                    Register
                  </Link>
                </p>
              </div>
            </Form>
          </Col>
        </Row>
        <ToastContainer />
      </Container>
    </div>
  );
};

export default ForgotPassword;

