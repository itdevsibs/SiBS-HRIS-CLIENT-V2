import { Component } from "react";

export default class BirthdayCelebrationErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // Fail silently without leaking user info
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
