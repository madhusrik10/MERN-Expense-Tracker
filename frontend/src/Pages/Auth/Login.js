// LoginPage.js
import { useCallback, useEffect, useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import "./auth.css";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import pennybloomLogo from "../../assets/pennybloom-logo.png";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { getApiErrorMessage, loginAPI } from "../../utils/ApiRequest";

const Login = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("user") && localStorage.getItem("token")) {
      navigate("/");
    }
  }, [navigate]);

  const [values, setValues] = useState({
    email: "",
    password: "",
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

    const { email, password } = values;

    // Frontend validation
    if(!email || !password){
      toast.error("Please fill all fields", toastOptions);
      return;
    }

    if(!email.includes("@") || !email.includes(".")){
      toast.error("Please enter a valid email address", toastOptions);
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(loginAPI, {
        email,
        password,
      });

      if (data.success === true) {
        if (!data.token) {
          throw new Error("Authentication is temporarily unavailable. Please try again later.");
        }
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        toast.success(data.message, toastOptions);
        // Delay navigation to show success message
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        toast.error(data.message, toastOptions);
        setLoading(false);
      }
    } catch (error) {
      // Handle network errors and API errors
      toast.error(getApiErrorMessage(error, "Login failed. Please try again."), toastOptions);
      setLoading(false);
      // Do NOT navigate on error - stay on login page
    }
  };

  const particlesInit = useCallback(async (engine) => {
    // console.log(engine);
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
              <h2>Welcome back</h2>
              <p>Continue growing better money habits.</p>
            </div>

            <Form onSubmit={handleSubmit} className="auth-form">
              <Form.Group controlId="formBasicEmail" className="form-group-auth">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  name="email"
                  onChange={handleChange}
                  value={values.email}
                />
              </Form.Group>

              <Form.Group controlId="formBasicPassword" className="form-group-auth">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Password"
                  onChange={handleChange}
                  value={values.password}
                />
              </Form.Group>

              <div className="auth-secondary-row">
                <label className="auth-check-row">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <Link to="/forgotPassword" className="lnk">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="btnStyle auth-submit" disabled={loading}>
                {loading ? "Signing in..." : "Log in"}
              </Button>

              <p className="auth-bottom-text">
                Don&apos;t have an account? <Link to="/register" className="lnk">Sign up</Link>
              </p>
            </Form>
          </Col>
        </Row>
        <ToastContainer />
      </Container>
    </div>
  );
};

export default Login;
