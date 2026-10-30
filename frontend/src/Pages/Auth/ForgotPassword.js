// ForgotPasswordPage.js
import { useCallback, useState, useEffect } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import pennybloomLogo from "../../assets/pennybloom-logo.png";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { forgotPasswordAPI, getApiErrorMessage } from "../../utils/ApiRequest";
import "./auth.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("user") && localStorage.getItem("token")) {
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
      toast.error(
        getApiErrorMessage(error, "Failed to process request. Please try again."),
        toastOptions
      );
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
    <div className="auth-page auth-page--split" style={{ position: "relative", overflow: "hidden" }}>
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
      <Container className="auth-shell">
        <Row className="auth-card auth-card--split g-0">
          <Col lg={5} className="auth-visual d-flex">
            <div className="auth-visual__content">
              <div className="brand-copy">
                <h1>PennyBloom</h1>
                <p>Grow better money habits.</p>
              </div>
              <img
                className="auth-illustration"
                src={pennybloomLogo}
                alt="A savings jar with growing leaves and coins"
              />
            </div>
          </Col>

          <Col lg={7} className="auth-panel">
            <div className="auth-panel__header">
              <h2>Reset your password</h2>
              <p>
                Enter your email address and we&apos;ll send you a secure link to reset
                your password.
              </p>
            </div>

            <Form onSubmit={handleSubmit} className="auth-form">
              <Form.Group controlId="formBasicEmail" className="form-group-auth">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  name="email"
                  onChange={handleChange}
                  value={values.email}
                />
              </Form.Group>

              <Button type="submit" className="btnStyle auth-submit" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <div className="auth-links">
                <p>
                  Remember your password? <Link to="/login" className="lnk">Login</Link>
                </p>
                <p>
                  Don&apos;t have an account? <Link to="/register" className="lnk">Register</Link>
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
