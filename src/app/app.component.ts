import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

type Operator = '+' | '-' | '×' | '÷' | null;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  display = '0';
  private firstOperand: number | null = null;
  private operator: Operator = null;
  private waitingForSecondOperand = false;
  private expression = ''; 

  history: string[] = [];

  // Drawer state
  showHistory = false;

  theme: 'dark' | 'light' = 'dark';

  // Prevents auto-open on initial render / HMR / SSR
  private hasAutoOpened = false;
  private appBooted = false;
  isClosing = false;

  toggleTheme(): void {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
  }

  ngOnInit(): void {
    // If you later add localStorage restore, do it here.
    // For now, explicitly keep closed on init.
    this.showHistory = false;
  }

  ngAfterViewInit(): void {
    // Mark that the app has fully booted so we don't auto-open before.
    this.appBooted = true;
  }

  toggleHistory(): void {
  if (this.showHistory) {
    // start closing
    this.isClosing = true;        // lets CSS clip during the animation
    this.showHistory = false;     // triggers the slide-left
    setTimeout(() => (this.isClosing = false), 220); // match CSS transition
  } else {
    this.showHistory = true;      // open normally
  }
}
  clearHistory(): void { this.history = []; }

  pressDigit(digit: string): void {
    if (this.waitingForSecondOperand) {
      this.display = digit;
      this.waitingForSecondOperand = false;
    } else {
      this.display = this.display === '0' ? digit : this.display + digit;
    }
  }

  pressDecimal(): void {
    if (this.waitingForSecondOperand) {
      this.display = '0.';
      this.waitingForSecondOperand = false;
      return;
    }
    if (!this.display.includes('.')) this.display += '.';
  }

pressOperator(op: Operator): void {
  const inputValue = parseFloat(this.display);

  // If user changes operator before typing the second operand
  if (this.operator && this.waitingForSecondOperand) {
    // update the last operator in the expression string
    this.expression = this.expression.replace(/[\+\-\×\÷]\s*$/, `${op} `);
    this.operator = op;
    return;
  }

  if (this.firstOperand === null) {
    // first operator in a new expression
    this.firstOperand = inputValue;
    this.expression = `${this.display} ${op} `;
  } else if (this.operator) {
    // we're chaining: append the current operand and operator to the expression
    this.expression += `${this.display} ${op} `;
    const result = this.calculate(this.firstOperand, inputValue, this.operator);
    this.display = String(result);
    this.firstOperand = result;
  } else {
    // safety: firstOperand is set but operator wasn't (e.g. after equals)
    this.firstOperand = inputValue;
    this.expression = `${this.display} ${op} `;
  }

  this.operator = op;
  this.waitingForSecondOperand = true;
}


  pressEquals(): void {
    if (this.operator === null || this.waitingForSecondOperand) return;
    const secondOperand = parseFloat(this.display);
    if (this.firstOperand === null) return;

    const result = this.calculate(this.firstOperand, secondOperand, this.operator);

    // Build a nice human-readable expression
    const fullExpression = this.expression
      ? `${this.expression}${this.display} = ${result}`
      : `${this.firstOperand} ${this.operator} ${secondOperand} = ${result}`;

    this.history.unshift(fullExpression);

    // Auto-open history the first time
    if (this.appBooted && !this.hasAutoOpened && this.history.length === 1) {
      this.showHistory = true;
      this.hasAutoOpened = true;
    }

    this.display = String(result);
    this.firstOperand = null;
    this.operator = null;
    this.waitingForSecondOperand = false;
    this.expression = '';    // reset for the next calculation
  }


  clearAll(): void {
    this.display = '0';
    this.firstOperand = null;
    this.operator = null;
    this.waitingForSecondOperand = false;
    this.expression = '';  
  }

  toggleSign(): void {
    if (this.display === '0') return;
    this.display = this.display.startsWith('-') ? this.display.slice(1) : '-' + this.display;
  }

  percent(): void {
    const value = parseFloat(this.display);
    if (isNaN(value)) return;
    this.display = String(value / 100);
  }

  private calculate(a: number, b: number, op: Operator): number {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? NaN : a / b;
      default:  return b;
    }
  }
}
