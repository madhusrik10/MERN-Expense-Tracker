// SignupPage.js
import { useCallback, useEffect, useState } from "react";
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import "./auth.css";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import pennybloomLogo from "../../assets/pennybloom-logo.png";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getApiErrorMessage, registerAPI } from "../../utils/ApiRequest";
import axios from "axios";

const Register = () => {

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if(localStorage.getItem('user')){
      navigate('/');
    }
  }, [navigate]);

  const particlesInit = useCallback(async (engine) => {
    // console.log(engine);
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    // await console.log(container);
  }, []);

  const [values, setValues] = useState({
    name : "",
    email : "",
    password : "",

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
  }

  const handleChange = (e) => {
    setValues({...values , [e.target.name]: e.target.value});
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {name, email, password} = values;

    // Frontend validation
    if(!name || !email || !password){
      toast.error("Please fill all fields", toastOptions);
      return;
    }

    if(password.length < 6){
      toast.error("Password must be at least 6 characters", toastOptions);
      return;
    }

    if(!email.includes("@") || !email.includes(".")){
      toast.error("Please enter a valid email address", toastOptions);
      return;
    }

    setLoading(true);

    try {
      const {data} = await axios.post(registerAPI, {
        name,
        email,
        password
      });

      if(data.success === true){
        delete data.user.password;
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        toast.success(data.message, toastOptions);
        // Delay navigation to show success message
        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
      else{
        toast.error(data.message, toastOptions);
        setLoading(false);
      }
    } catch (error) {
      // Handle network errors and API errors
      toast.error(getApiErrorMessage(error, "Registration failed. Please try again."), toastOptions);
      setLoading(false);
      // Do NOT navigate on error - stay on registration page
    }
  };

  return (
    <div className="auth-page auth-page--split" style={{ position: 'relative', overflow: 'hidden' }}>
      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          background: {
            color: {
              value: '#000',
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
              value: '#ffcc00',
            },
            shape: {
              type: 'circle',
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
          position: 'absolute',
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
              <h2>Create your account</h2>
              <p>Join us and start your financial journey.</p>
            </div>

            <Form onSubmit={handleSubmit} className="auth-form">
              <Form.Group controlId="formBasicName" className="form-group-auth">
                <Form.Label>Full name</Form.Label>
                <Form.Control type="text" name="name" placeholder="Full name" value={values.name} onChange={handleChange} />
              </Form.Group>

              <Form.Group controlId="formBasicEmail" className="form-group-auth">
                <Form.Label>Email address</Form.Label>
                <Form.Control type="email" name="email" placeholder="Enter email" value={values.email} onChange={handleChange} />
              </Form.Group>

              <Form.Group controlId="formBasicPassword" className="form-group-auth">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" name="password" placeholder="Password" value={values.password} onChange={handleChange} />
              </Form.Group>

              <Button type="submit" className="btnStyle auth-submit" disabled={loading}>
                {loading ? "Registering..." : "Create account"}
              </Button>

              <p className="auth-bottom-text">
                Already have an account? <Link to="/login" className="lnk">Login</Link>
              </p>
            </Form>
          </Col>
        </Row>
        <ToastContainer />
      </Container>
    </div>
  );
}

export default Register